

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getSuppliers, type Supplier } from '@/services/suppliers';
import { getItems, type Item } from '@/services/items';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompany } from '@/context/company-context';
import type { Purchase } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { createPurchaseAction } from './actions';

interface PurchaseItem extends Partial<Item> {
  id: string; // Temporary unique ID for list management
  dbItemId?: string;
  manualName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export default function NewPurchasePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { companyInfo } = useCompany();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>();
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    new Date()
  );
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  
  const [taxAmount, setTaxAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Unpaid');
  const [orderStatus, setOrderStatus] = useState<'Received' | 'Pending' | 'Cancelled'>('Pending');
  const [notes, setNotes] = useState('');

  const currency = companyInfo?.currencySymbol || '$';


  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [fetchedSuppliers, fetchedItems] = await Promise.all([
          getSuppliers(),
          getItems(),
        ]);
        setSuppliers(fetchedSuppliers);
        setItems(fetchedItems);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load initial data.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const handleAddItem = () => {
    const newItem: PurchaseItem = {
      id: `temp-${Date.now()}`,
      manualName: '',
      quantity: 1,
      unitCost: 0,
      total: 0,
    };
    setPurchaseItems([...purchaseItems, newItem]);
  };
  
  const handleRemoveItem = (id: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.id !== id));
  }
  
  const handleItemChange = (id: string, field: keyof PurchaseItem, value: any) => {
    setPurchaseItems(prevItems => {
        return prevItems.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                if (field === 'dbItemId') {
                    const selectedDbItem = items.find(i => i.id === value);
                    if (selectedDbItem) {
                        updatedItem.manualName = selectedDbItem.name;
                        updatedItem.unitCost = selectedDbItem.purchasePrice || 0;
                    }
                }

                updatedItem.total = updatedItem.quantity * updatedItem.unitCost;
                return updatedItem;
            }
            return item;
        });
    });
  };

  const summary = useMemo(() => {
    const subtotal = purchaseItems.reduce((acc, item) => acc + item.total, 0);
    const total = subtotal + taxAmount + shippingCost;
    const remaining = total - paidAmount;
    return { subtotal, total, remaining };
  }, [purchaseItems, taxAmount, shippingCost, paidAmount]);

  const handleSave = async () => {
    if (!selectedSupplier) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select a supplier.' });
        return;
    }
     if (purchaseItems.length === 0) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Please add at least one item to the purchase order.' });
        return;
    }

    setIsSaving(true);
    const supplierDetails = suppliers.find(s => s.id === selectedSupplier);
    if (!supplierDetails || !purchaseDate || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Missing required information.' });
        setIsSaving(false);
        return;
    }

    const purchaseData: Omit<Purchase, 'id' | 'purchaseId'> = {
        date: purchaseDate.toISOString(),
        supplier: supplierDetails.name,
        supplierId: selectedSupplier,
        totalAmount: summary.total,
        paidAmount: paidAmount,
        dueAmount: summary.remaining,
        orderStatus: orderStatus,
        paymentStatus: paymentStatus,
        createdBy: user.displayName || 'Admin',
        items: purchaseItems.map(item => ({
            id: item.dbItemId || item.id,
            manualName: item.manualName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.total
        })),
        taxAmount,
        shippingCost,
        notes,
        paymentTerms,
    }

    try {
        await createPurchaseAction(purchaseData);
        toast({ title: 'Success', description: 'Purchase Order created successfully!' });
        router.push('/purchase');
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create purchase order.' });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Order Details</CardTitle>
        <CardDescription>Fill in information.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="supplier">Supplier</Label>
            <div className="flex gap-2">
              <Select onValueChange={setSelectedSupplier} value={selectedSupplier}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id!} value={s.id!}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="whitespace-nowrap flex gap-2" onClick={() => router.push('/suppliers/new')}>
                <Plus className="h-4 w-4" /> New Supplier
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="purchase-date">Purchase Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="purchase-date"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !purchaseDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {purchaseDate ? format(purchaseDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={setPurchaseDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
             <Label htmlFor="po-id">Purchase Order ID</Label>
             <Input id="po-id" disabled value="Auto-generated on save" />
             <p className="text-xs text-muted-foreground">The PO ID is automatically generated.</p>
          </div>
        </div>

        <Separator />
        
        <div>
            <h3 className="text-lg font-medium mb-2">Items to Purchase</h3>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">DB Item</TableHead>
                            <TableHead className="w-[25%]">Item Name</TableHead>
                            <TableHead className="w-[10%]">Qty</TableHead>
                            <TableHead className="w-[15%]">Unit Cost</TableHead>
                            <TableHead className="text-right w-[15%]">Total</TableHead>
                            <TableHead className="w-[5%]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchaseItems.map(item => (
                            <TableRow key={item.id} className="align-top">
                                <TableCell>
                                     <Select value={item.dbItemId || ''} onValueChange={(value) => handleItemChange(item.id, 'dbItemId', value)}>
                                        <SelectTrigger><SelectValue placeholder="Search or Select..."/></SelectTrigger>
                                        <SelectContent>
                                            {items.map(i => <SelectItem key={i.id!} value={i.id!}>{i.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input value={item.manualName || ''} onChange={(e) => handleItemChange(item.id, 'manualName', e.target.value)} placeholder="Manual Name" />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" value={item.quantity || 0} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" value={item.unitCost || 0} onChange={(e) => handleItemChange(item.id, 'unitCost', parseFloat(e.target.value) || 0)}/>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {currency}{(item.total || 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
                <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-muted/50 rounded-md">
                <Label>Subtotal ({currency})</Label>
                <div className="text-2xl font-bold">{currency}{summary.subtotal.toFixed(2)}</div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="tax-amount">Tax Amount ({currency})</Label>
                <Input id="tax-amount" type="number" value={taxAmount} onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="shipping-cost">Shipping Cost ({currency})</Label>
                <Input id="shipping-cost" type="number" value={shippingCost} onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)} />
            </div>
        </div>

        <Separator />

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="grid gap-2">
                <Label htmlFor="paid-amount">Paid Amount ({currency})</Label>
                <Input id="paid-amount" type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="p-4 bg-muted/50 rounded-md">
                <Label>Remaining ({currency})</Label>
                <div className="text-2xl font-bold text-green-600">{currency}{summary.remaining.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-md text-right">
                <Label>Total ({currency})</Label>
                <div className="text-2xl font-bold">{currency}{summary.total.toFixed(2)}</div>
            </div>
        </div>
        
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="grid gap-2">
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger id="payment-terms"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as any)}>
                    <SelectTrigger id="payment-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="order-status">Order Status</Label>
                <Select value={orderStatus} onValueChange={(value) => setOrderStatus(value as any)}>
                    <SelectTrigger id="order-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Ordered">Ordered</SelectItem>
                        <SelectItem value="Received">Received</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground">Select 'Received' to update stock and tank levels. Other statuses like 'Ordered' or 'Pending' will update supplier balance if applicable.</p>
            </div>
        </div>

         <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />
        </div>


      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
            Save PO
        </Button>
      </CardFooter>
    </Card>
  );
}

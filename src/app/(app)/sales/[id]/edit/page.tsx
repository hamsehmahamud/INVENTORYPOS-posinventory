
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCustomers, type Customer } from '@/services/customers';
import { getItems, type Item } from '@/services/items';
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { getSaleById, updateSale } from '@/services/sales';
import type { SaleWithItems } from '@/services/sales';
import { OrderPayload } from '@/app/(app)/pos/actions';


import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderItem extends Item {
  orderQuantity: number;
}

export default function EditSalePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>("walkin");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [otherCharges, setOtherCharges] = useState(0);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [saleId, setSaleId] = useState('');

  const fetchSaleData = useCallback(async () => {
    if (!id) return;
     try {
      const saleData = await getSaleById(id);
       if (saleData) {
        setSaleId(saleData.orderId);
        setSelectedCustomer(saleData.customerId || "walkin");
        setDate(new Date(saleData.date));
        setOtherCharges(saleData.otherCharges || 0);
        setOverallDiscount(saleData.discount || 0);

        const fetchedItems = await getItems();
        setItems(fetchedItems);

        const itemsForOrder = saleData.items.map(saleItem => {
            const itemDetail = fetchedItems.find(i => i.id === saleItem.itemId || i.name === saleItem.name);
            return {
                ...(itemDetail as Item),
                orderQuantity: saleItem.quantity,
            }
        }).filter(Boolean) as OrderItem[];
        setOrderItems(itemsForOrder);
       } else {
         toast({ variant: 'destructive', title: 'Error', description: 'Sale not found.' });
         router.push('/sales');
       }
     } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch sale details.' });
     }

  }, [id, router, toast]);

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      try {
        const fetchedCustomers = await getCustomers();
        setCustomers(fetchedCustomers);
        await fetchSaleData();
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to load initial data.", });
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [fetchSaleData, toast]);
  
  const handleAddItem = (itemId: string | undefined) => {
    if (!itemId) return;
    const itemToAdd = items.find(i => i.id === itemId);
    if (!itemToAdd) return;

    setOrderItems(prev => {
        const existingItem = prev.find(i => i.id === itemId);
        if (existingItem) {
            return prev.map(i => i.id === itemId ? { ...i, orderQuantity: i.orderQuantity + 1 } : i);
        }
        return [...prev, { ...itemToAdd, orderQuantity: 1 }];
    });
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(i => i.id !== itemId));
  };
  
  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setOrderItems(prev => prev.map(i => i.id === itemId ? { ...i, orderQuantity: quantity } : i));
  }
  
  const summary = useMemo(() => {
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.orderQuantity, 0);
    const grandTotal = subtotal + otherCharges - overallDiscount;
    return { subtotal, grandTotal }
  }, [orderItems, otherCharges, overallDiscount]);
  
  const handleUpdateSale = async () => {
    if (!id || orderItems.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item to the sale.' });
        return;
    }
    setIsSaving(true);
    const customerName = customers.find(c => c.id === selectedCustomer)?.name || "Walk-in Customer";
    
    const payload: Partial<SaleWithItems> = {
      customerId: selectedCustomer,
      customer: customerName,
      date: date?.toISOString(),
      items: orderItems.map(item => ({
        itemId: item.id!,
        name: item.name,
        quantity: item.orderQuantity,
        price: item.price,
      })),
      otherCharges,
      discount: overallDiscount,
      total: summary.grandTotal,
    };

    try {
        await updateSale(id, payload);
        toast({ title: 'Success', description: 'Sale updated successfully!' });
        router.push('/sales');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Update Failed', description: errorMessage });
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
    return <Card><CardContent><Skeleton className="w-full h-[400px]" /></CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Sale: {saleId}</CardTitle>
        <CardDescription>Update sale details below.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="grid gap-2 col-span-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}><SelectTrigger id="customer"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="walkin">Walk-in Customer</SelectItem>{customers.map(c => <SelectItem key={c.id!} value={c.id!}>{c.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-date">Sales Date</Label>
             <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent></Popover>
          </div>
        </div>
        <div className="grid gap-4">
            <Select onValueChange={handleAddItem}><SelectTrigger><SelectValue placeholder="Add an item..." /></SelectTrigger><SelectContent>{items.map(item => <SelectItem key={item.id!} value={item.id!}>{item.name}</SelectItem>)}</SelectContent></Select>
            <div className="border rounded-md">
                 <Table>
                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Quantity</TableHead><TableHead>Price</TableHead><TableHead>Total</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {orderItems.map(item => (
                            <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell><Input type="number" value={item.orderQuantity} onChange={(e) => handleQuantityChange(item.id!, parseInt(e.target.value))} className="w-20 h-8" /></TableCell><TableCell>${item.price.toFixed(2)}</TableCell><TableCell>${(item.price * item.orderQuantity).toFixed(2)}</TableCell><TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.id!)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="other_charges_input">Other Charges</Label><Input id="other_charges_input" type="number" value={otherCharges} onChange={e => setOtherCharges(parseFloat(e.target.value) || 0)} /></div>
                <div className="grid gap-2"><Label htmlFor="discount_on_all">Discount on All</Label><Input id="discount_on_all" type="number" value={overallDiscount} onChange={e => setOverallDiscount(parseFloat(e.target.value) || 0)} /></div>
            </div>
            <Separator />
            <div className="flex justify-end text-lg font-bold"><span>Grand Total:</span><span className="ml-4">${summary.grandTotal.toFixed(2)}</span></div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleUpdateSale} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
      </CardFooter>
    </Card>
  );
}

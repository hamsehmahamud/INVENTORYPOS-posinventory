
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getCustomers, type Customer } from "@/services/customers";
import { getItems, type Item } from "@/services/items";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createSaleAction, type OrderPayload } from "@/app/(app)/pos/actions";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useHold } from "@/context/hold-context";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Plus, List, Trash2, Loader2, User, Handshake, Printer, Save, Hand } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";


interface OrderItem extends Item {
  orderQuantity: number;
}

interface Payment {
    id: string;
    type: string;
    amount: number;
    note?: string;
    date: Date;
}

type SaleAction = "loan" | "cash" | "multiple" | null;


export default function NewSalePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { companyInfo } = useCompany();
  const { holdOrder, currentHold, clearCurrentHold } = useHold();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState("walkin");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [otherCharges, setOtherCharges] = useState(0);
  const [overallDiscount, setOverallDiscount] = useState(0);

  const [isMultiPayOpen, setIsMultiPayOpen] = useState(false);
  const [cashPaid, setCashPaid] = useState(0);
  const [cardPaid, setCardPaid] = useState(0);
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [saleAction, setSaleAction] = useState<SaleAction>(null);

  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    if (currentHold) {
        setOrderItems(currentHold.items);
        setSelectedCustomer(currentHold.customerId);
        setOtherCharges(currentHold.otherCharges);
        setOverallDiscount(currentHold.overallDiscount);
        clearCurrentHold();
    }
  }, [currentHold, clearCurrentHold]);


  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [fetchedCustomers, fetchedItems] = await Promise.all([
          getCustomers(),
          getItems(),
        ]);
        setCustomers(fetchedCustomers);
        setItems(fetchedItems);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load necessary data for sales.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);
  
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
  
  const orderSummary = useMemo(() => {
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.orderQuantity, 0);
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.orderQuantity), 0);
    const totalDiscount = overallDiscount;
    const grandTotal = totalAmount - totalDiscount + otherCharges;
    return { totalQuantity, totalAmount, totalDiscount, grandTotal };
  }, [orderItems, otherCharges, overallDiscount]);

  const paymentSummary = useMemo(() => {
    const totalPaid = cashPaid + cardPaid;
    const balance = orderSummary.grandTotal - totalPaid;
    return { totalPaid, balance: balance < 0 ? 0 : balance };
  }, [cashPaid, cardPaid, orderSummary.grandTotal]);
  
  const resetSale = () => {
    setOrderItems([]);
    setOtherCharges(0);
    setOverallDiscount(0);
    setSelectedCustomer("walkin");
    setCashPaid(0);
    setCardPaid(0);
    setSaleAction(null);
  };

  const handleHold = () => {
    if (orderItems.length === 0) {
        toast({ variant: 'destructive', title: 'Cart is Empty', description: 'Please add items to the cart to hold an order.' });
        return;
    }
    const customer = customers.find(c => c.id === selectedCustomer);
    holdOrder({
        items: orderItems,
        customerId: selectedCustomer,
        customerName: customer?.name || "Walk-in Customer",
        otherCharges,
        overallDiscount
    });
    resetSale();
  };
  
  const handleInitiateSale = (action: SaleAction) => {
    if (orderItems.length === 0) {
        toast({ variant: 'destructive', title: 'Cannot Proceed', description: 'Please add items to the cart first.' });
        return;
    }

    if (action === 'loan' && selectedCustomer === "walkin") {
        toast({ variant: 'destructive', title: 'Customer Required', description: 'Please select a customer for a loan sale.' });
        return;
    }

    setSaleAction(action);
    if (action === 'multiple') {
        setIsMultiPayOpen(true);
    } else {
        setIsConfirming(true);
    }
  };

  const handleFinalizeSale = async (andPrint: boolean) => {
    if (!saleAction) return;

    setIsConfirming(false);
    setIsSaving(true);
    
    let payload: OrderPayload;
    const customerName = customers.find(c => c.id === selectedCustomer)?.name || "Walk-in Customer";
    
    let finalPayments: Omit<Payment, 'id'>[] = [];
    let saleStatus: 'Fulfilled' | 'Pending' = 'Fulfilled';

    if (saleAction === 'loan') {
        saleStatus = 'Pending';
    } else if (saleAction === 'cash') {
        finalPayments = [{ type: 'Cash', amount: orderSummary.grandTotal, date: new Date() }];
    } else if (saleAction === 'multiple') {
        if (cashPaid > 0) finalPayments.push({ type: 'Cash', amount: cashPaid, date: new Date() });
        if (cardPaid > 0) finalPayments.push({ type: 'Card', amount: cardPaid, date: new Date() });
    }
    
    const totalPaid = finalPayments.reduce((sum, p) => sum + p.amount, 0);
    const isPartialPayment = totalPaid < orderSummary.grandTotal;

    if (isPartialPayment && selectedCustomer === 'walkin') {
        toast({ variant: 'destructive', title: 'Customer Required', description: `Please select a customer to save a due amount.` });
        setIsSaving(false);
        return;
    }
    if (isPartialPayment && saleAction !== 'loan') {
        saleStatus = 'Pending';
    }

    payload = {
        customerId: selectedCustomer,
        customerName: customerName,
        items: orderItems.map(item => ({ itemId: item.id!, name: item.name, quantity: item.orderQuantity, price: item.price })),
        otherCharges,
        discount: orderSummary.totalDiscount,
        total: orderSummary.grandTotal,
        grandTotal: orderSummary.grandTotal,
        payments: finalPayments,
        status: saleStatus,
        createdBy: user?.displayName || null,
        date: date || new Date(),
        orderId: '',
    };

    try {
        const result = await createSaleAction(payload);
        if (result.success && result.orderId) {
            toast({ title: "Sale Created", description: `Successfully created sale.` });
            
            if (andPrint) {
                const printUrl = `/pos/invoice?orderId=${result.orderId}`;
                window.open(printUrl, '_blank');
            }

            resetSale();
            setIsMultiPayOpen(false);
            router.push('/sales');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Failed to Create Sale', description: errorMessage });
    } finally {
        setIsSaving(false);
        setSaleAction(null);
    }
  };
    
    useEffect(() => {
        if (!isMultiPayOpen) {
            setCardPaid(0);
            setCashPaid(0);
        }
    }, [isMultiPayOpen]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="grid gap-2 col-span-2">
            <Label htmlFor="customer">Customer Name *</Label>
            <div className="flex gap-2">
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walkin">Walk-in Customer</SelectItem>
                  {customers.map(c => <SelectItem key={c.id!} value={c.id!}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="icon" variant="outline"><User className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sales-date">Sales Date *</Label>
             <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status *</Label>
            <Select defaultValue="final">
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
            <div className="relative">
                <List className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select onValueChange={handleAddItem}>
                    <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Item name/Barcode/Itemcode" />
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item, index) => <SelectItem key={`${item.id!}-${index}`} value={item.id!}>{item.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="border rounded-md">
                 <Table>
                    <TableHeader className="bg-primary/10">
                        <TableRow>
                            <TableHead className="text-primary w-[200px]">Item Name</TableHead>
                            <TableHead className="text-primary">Stock</TableHead>
                            <TableHead className="text-primary">Quantity</TableHead>
                            <TableHead className="text-primary">Unit Price</TableHead>
                            <TableHead className="text-primary">Total</TableHead>
                            <TableHead className="text-primary">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orderItems.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        value={item.orderQuantity} 
                                        onChange={(e) => handleQuantityChange(item.id!, parseInt(e.target.value))}
                                        className="w-20 h-8"
                                     />
                                </TableCell>
                                <TableCell>{currency}{item.price.toFixed(2)}</TableCell>
                                <TableCell>{currency}{(item.price * item.orderQuantity).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveItem(item.id!)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-4">
                    <div className="flex items-center gap-4">
                        <Label className="w-32">Total Quantity</Label>
                        <span className="font-bold">{orderSummary.totalQuantity.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="other_charges_input" className="w-32">Other Charges</Label>
                        <Input id="other_charges_input" type="number" value={otherCharges} onChange={e => setOtherCharges(parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="discount_on_all" className="w-32">Discount on All</Label>
                        <Input id="discount_on_all" type="number" value={overallDiscount} onChange={e => setOverallDiscount(parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    </div>
                </div>
                <div className="space-y-2 text-right">
                    <div className="flex justify-between">
                        <span className="font-medium">Subtotal</span>
                        <span>{currency}{orderSummary.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Other Charges</span>
                        <span>{currency}{otherCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Discount on All</span>
                        <span>{currency}{overallDiscount.toFixed(2)}</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Grand Total</span>
                        <span>{currency}{orderSummary.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end flex-wrap gap-2 p-6 pt-0">
        <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white min-w-[120px]" onClick={handleHold}><Hand className="mr-2 h-4 w-4"/>Hold</Button>
            <Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white min-w-[120px]" onClick={() => handleInitiateSale('loan')} disabled={isSaving}>
            {isSaving && saleAction === 'loan' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Handshake/>}
            Loan
        </Button>
        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]" onClick={() => handleInitiateSale('multiple')} disabled={isSaving}>Multiple</Button>
        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white min-w-[120px]" onClick={() => handleInitiateSale('cash')} disabled={isSaving}>
            {isSaving && saleAction === 'cash' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cash / Pay All
        </Button>
      </CardFooter>
    </Card>

    <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Sale</AlertDialogTitle>
                <AlertDialogDescription>
                    Finalize the transaction. Do you need to print a receipt for this sale?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => handleFinalizeSale(false)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Only
                </Button>
                <Button onClick={() => handleFinalizeSale(true)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    Save and Print
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={isMultiPayOpen} onOpenChange={setIsMultiPayOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Multiple Payment</DialogTitle>
                <DialogDescription>
                    Enter amounts paid by different methods for a total of {currency}{orderSummary.grandTotal.toFixed(2)}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="cash-paid" className="text-right">Cash Paid:</Label>
                    <Input id="cash-paid" type="number" value={cashPaid} onChange={e => setCashPaid(Number(e.target.value))} className="col-span-2" />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="card-paid" className="text-right">Card Paid:</Label>
                    <Input id="card-paid" type="number" value={cardPaid} onChange={e => setCardPaid(Number(e.target.value))} className="col-span-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-3 items-center gap-4 font-medium">
                    <Label className="text-right">Total Paid (Cash/Card):</Label>
                    <div className="col-span-2">{currency}{paymentSummary.totalPaid.toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-3 items-center gap-4 font-bold text-red-600">
                    <Label className="text-right">Amount Remaining:</Label>
                    <div className="col-span-2">{currency}{paymentSummary.balance.toFixed(2)}</div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="button" onClick={() => { setIsMultiPayOpen(false); setIsConfirming(true); }} disabled={isSaving}>
                    Confirm Payments
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

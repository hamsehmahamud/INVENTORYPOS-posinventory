
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { PlusCircle, Search, User, Trash2, RefreshCw, Smartphone, Loader2, Save, Printer, Plus, Handshake, Hand, LayoutDashboard, List, Boxes, Truck, Users2 } from "lucide-react";
import { getItems, type Item } from "@/services/items";
import { getCustomers, type Customer } from "@/services/customers";
import { useToast } from "@/hooks/use-toast";
import { createSaleAction, type OrderPayload } from "./actions";
import { useAuth } from "@/context/auth-context";
import { useHold } from "@/context/hold-context";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from "@/context/company-context";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";


interface OrderItem extends Item {
  orderQuantity: number;
  discount: number;
  taxAmount: number;
  subtotal: number;
}

interface Payment {
    id: string;
    type: string;
    amount: number;
    note?: string;
    date: Date;
}

type SaleAction = "loan" | "cash" | "multiple" | null;


export default function PosPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const { companyInfo } = useCompany();
    const { holdOrder, currentHold, clearCurrentHold } = useHold();
    const { setOpen } = useSidebar();
    
    const [products, setProducts] = useState<Item[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [selectedCustomer, setSelectedCustomer] = useState<string>("walkin");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedBrand, setSelectedBrand] = useState<string>("all");
    const [productSearchTerm, setProductSearchTerm] = useState<string>("");
    const [otherCharges, setOtherCharges] = useState<number>(0);
    const [overallDiscount, setOverallDiscount] = useState<number>(0);

    const [isMultiPayOpen, setIsMultiPayOpen] = useState(false);
    const [cashPaid, setCashPaid] = useState(0);
    const [cardPaid, setCardPaid] = useState(0);
    
    const [isConfirming, setIsConfirming] = useState(false);
    const [saleAction, setSaleAction] = useState<SaleAction>(null);

    const currency = companyInfo?.currencySymbol || '$';
    
    useEffect(() => {
        // Automatically collapse sidebar on POS page
        setOpen(false);
    }, [setOpen]);
    
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
                const [fetchedItems, fetchedCustomers] = await Promise.all([
                    getItems(),
                    getCustomers()
                ]);
                setProducts(fetchedItems);
                setCustomers(fetchedCustomers);
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load data for POS.",
                });
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [toast]);

    const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);
    const brands = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))] as string[], [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
            const brandMatch = selectedBrand === 'all' || product.brand === selectedBrand;
            const searchMatch = !productSearchTerm || product.name.toLowerCase().includes(productSearchTerm.toLowerCase());
            return categoryMatch && brandMatch && searchMatch;
        });
    }, [products, selectedCategory, selectedBrand, productSearchTerm]);

    const handleAddItemToOrder = (product: Item) => {
        setOrderItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                if(existingItem.orderQuantity < existingItem.quantity) {
                    return prevItems.map(item =>
                        item.id === product.id ? { ...item, orderQuantity: item.orderQuantity + 1 } : item
                    );
                } else {
                    toast({ variant: 'destructive', title: 'Stock Limit', description: `Cannot add more ${product.name}.` });
                    return prevItems;
                }
            } else {
                if (product.quantity > 0) {
                    return [...prevItems, { 
                        ...product, 
                        orderQuantity: 1, 
                        discount: 0, // Placeholder
                        taxAmount: 0, // Placeholder tax
                        subtotal: product.price // Placeholder
                    }];
                } else {
                     toast({ variant: 'destructive', title: 'Out of Stock', description: `${product.name} is out of stock.` });
                     return prevItems;
                }
            }
        });
    };

    const handleUpdateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
         const product = products.find(p => p.id === productId);
         if (product && newQuantity > product.quantity) {
             toast({ variant: 'destructive', title: 'Stock Limit', description: `Only ${product.quantity} units of ${product.name} available.` });
             return;
         }
        setOrderItems(prevItems =>
            prevItems.map(item =>
                item.id === productId ? { ...item, orderQuantity: newQuantity } : item
            )
        );
    };

     const handleRemoveItem = (productId: string) => {
        setOrderItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const orderSummary = useMemo(() => {
        const totalQuantity = orderItems.reduce((sum, item) => sum + item.orderQuantity, 0);
        const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.orderQuantity), 0);
        const totalDiscount = 0; // Simplified
        const grandTotal = totalAmount - totalDiscount + otherCharges;
        return { totalQuantity, totalAmount, totalDiscount, grandTotal };
    }, [orderItems, otherCharges]);

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
        setIsProcessing(true);
        
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
            setIsProcessing(false);
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
            date: new Date(),
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
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Failed to Create Sale', description: errorMessage });
        } finally {
            setIsProcessing(false);
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
    <div className="grid flex-1 items-start gap-4 p-0 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-5 xl:grid-cols-5">
      
      {/* Left side: Sales Invoice */}
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
        
        <Card className="hidden md:block">
            <CardContent className="p-2 flex items-center justify-around">
                <Button variant="ghost" asChild><Link href="/dashboard"><div className="flex flex-col items-center gap-1"><LayoutDashboard/><span className="text-xs">Dashboard</span></div></Link></Button>
                <Button variant="ghost" asChild><Link href="/sales"><div className="flex flex-col items-center gap-1"><List/><span className="text-xs">Sales List</span></div></Link></Button>
                <Button variant="ghost" asChild><Link href="/items"><div className="flex flex-col items-center gap-1"><Boxes/><span className="text-xs">Item List</span></div></Link></Button>
                <Button variant="ghost" asChild><Link href="/purchase/new"><div className="flex flex-col items-center gap-1"><Truck/><span className="text-xs">New Purchase</span></div></Link></Button>
                <Button variant="ghost" asChild><Link href="/customers"><div className="flex flex-col items-center gap-1"><Users2/><span className="text-xs">Customers</span></div></Link></Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Sales Invoice</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                         <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="walkin">Walk-in Customer</SelectItem>
                                {customers.map(c => <SelectItem key={c.id!} value={c.id!}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Button variant="outline" size="icon" asChild>
                            <Link href="/customers/new"><User className="h-4 w-4" /></Link>
                        </Button>
                    </div>
                    <div>
                        <Input placeholder="Item name/Barcode/Itemcode [Ctrl+Shift+S]" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-primary/10">
                            <TableHead className="w-[200px]">Item Name</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead><span className="sr-only">Delete</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {orderItems.map((item, index) => (
                                <TableRow key={`${item.id}-${index}`}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            value={item.orderQuantity} 
                                            className="w-20 h-8" 
                                            onChange={(e) => handleUpdateQuantity(item.id!, parseInt(e.target.value))}
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

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="send-sms" />
                        <Label htmlFor="send-sms">Send SMS to Customer</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="other-charges" className="whitespace-nowrap">Other Charges</Label>
                        <Input 
                            id="other-charges" 
                            type="number" 
                            value={otherCharges}
                            onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                         />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-center bg-muted p-2 rounded-md">
                   <div>
                        <p className="font-medium">Quantity:</p>
                        <p>{orderSummary.totalQuantity}</p>
                   </div>
                   <div>
                        <p className="font-medium">Total Amount:</p>
                        <p>{currency}{orderSummary.totalAmount.toFixed(2)}</p>
                   </div>
                    <div>
                        <p className="font-medium">Total Discount:</p>
                        <p>{currency}{orderSummary.totalDiscount.toFixed(2)}</p>
                   </div>
                    <div>
                        <p className="font-medium">Grand Total:</p>
                        <p className="font-bold text-lg">{currency}{orderSummary.grandTotal.toFixed(2)}</p>
                   </div>
                </div>

            </CardContent>
            <div className="flex flex-wrap gap-2 p-6 pt-0">
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white min-w-[120px]" onClick={handleHold}><Hand className="mr-2 h-4 w-4"/>Hold</Button>
                 <Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white min-w-[120px]" onClick={() => handleInitiateSale('loan')} disabled={isProcessing}>
                    {isProcessing && saleAction === 'loan' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Handshake/>}
                    Loan
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]" onClick={() => handleInitiateSale('multiple')} disabled={isProcessing}>Multiple</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white min-w-[120px]" onClick={() => handleInitiateSale('cash')} disabled={isProcessing}>
                    {isProcessing && saleAction === 'cash' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Cash / Pay All
                </Button>
            </div>
        </Card>
      </div>

      {/* Right side: Product Selection */}
      <div className="sticky top-16 grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
         <div className="grid grid-cols-2 gap-4">
             <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
            </Select>
             <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                     <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
            </Select>
         </div>

         <div className="flex items-center gap-2">
             <Input 
                placeholder="Item Name" 
                className="flex-1"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
             <Button variant="outline" size="icon" onClick={() => setProductSearchTerm("")}>
                <RefreshCw className="h-4 w-4" />
             </Button>
         </div>

         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[70vh] overflow-y-auto pr-2">
              {loading ? (
                Array.from({length: 12}).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-2"><Skeleton className="aspect-square w-full rounded-md" /></CardContent>
                        <CardFooter className="p-2 flex-col items-center"><Skeleton className="h-4 w-3/4 mb-1" /><Skeleton className="h-5 w-1/2" /></CardFooter>
                    </Card>
                ))
              ) : (
                filteredProducts.map((product, index) => (
                    <Card key={`${product.id}-${index}`} className="overflow-hidden cursor-pointer bg-green-200/50 dark:bg-green-800/20 border-green-500/50" onClick={() => handleAddItemToOrder(product)}>
                    <CardHeader className="p-1 bg-red-500 text-white text-center text-xs">
                            Qty: {product.quantity.toFixed(2)}
                    </CardHeader>
                    <CardContent className="p-2">
                        <Image
                        alt={product.name}
                        className="aspect-square w-full rounded-md object-cover"
                        height="150"
                        src={product.image || "https://placehold.co/150x150.png"}
                        width="150"
                        data-ai-hint="product image"
                        />
                    </CardContent>
                    <div className="flex flex-col items-center p-2 text-center">
                        <h3 className="font-semibold text-xs leading-tight">{product.name}</h3>
                        <p className="text-sm font-bold">{currency}{product.price.toFixed(2)}</p>
                    </div>
                    </Card>
              )))}
            </div>
      </div>
    </div>
     <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Sale</AlertDialogTitle>
                <AlertDialogDescription>
                    Finalize the transaction. Do you need to print a receipt for this sale?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => handleFinalizeSale(false)} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sell Only
                </Button>
                <Button onClick={() => handleFinalizeSale(true)} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    Sell and Print Invoice
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
                <Button type="button" onClick={() => { setIsMultiPayOpen(false); setIsConfirming(true); }} disabled={isProcessing}>
                    Confirm Payments
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

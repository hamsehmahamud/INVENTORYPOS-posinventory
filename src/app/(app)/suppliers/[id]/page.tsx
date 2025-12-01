
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupplierById, type Supplier } from '@/services/suppliers';
import { getPurchases, type Purchase } from '@/services/purchases';
import { getSupplierPayments, addSupplierPayment, type SupplierPayment } from '@/services/supplier-payments';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building, DollarSign, AlertCircle, Printer, ArrowLeft, Send } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/company-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

interface SupplierWithStats extends Supplier {
  currentBalance: number;
}

interface Transaction {
  id: string;
  date: string;
  type: 'Purchase' | 'Payment' | 'Return';
  description: React.ReactNode;
  debit: number; // Amount you owe supplier
  credit: number; // Amount you paid supplier
  balance: number;
  status?: 'Paid' | 'On Account' | 'Returned' | 'Unpaid' | 'Partial';
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be positive.'),
  notes: z.string().optional(),
});


export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [supplier, setSupplier] = useState<SupplierWithStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  const currency = companyInfo?.currencySymbol || '$';

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0, notes: '' },
  });

  const fetchData = async () => {
    if (!id) {
        setError('No supplier ID provided.');
        setLoading(false);
        return;
    }
    try {
        setLoading(true);
        setError(null);
        
        const [supplierData, allPurchases, allPayments] = await Promise.all([
            getSupplierById(id),
            getPurchases(),
            getSupplierPayments()
        ]);
        
        if (supplierData) {
            const supplierPurchases = allPurchases.filter(p => p.supplierId === supplierData.id);
            const supplierPayments = allPayments.filter(p => p.supplierId === supplierData.id);

            const openingBalance = supplierData.initialBalance || 0;

            const purchaseTransactions: Transaction[] = supplierPurchases.map(purchase => ({
                id: `purchase-${purchase.id}`,
                date: purchase.date,
                type: purchase.orderStatus === 'Cancelled' ? 'Return' : 'Purchase',
                description: (
                    <div>
                        <p className="font-medium">Purchase Order - #{purchase.purchaseId}</p>
                        <div className="pl-4 border-l-2 border-muted">
                        {purchase.items.slice(0, 2).map((item, index) => (
                            <p key={index} className="text-xs text-muted-foreground">
                                {item.manualName}, Qty: {item.quantity}
                            </p>
                        ))}
                        {purchase.items.length > 2 && <p className="text-xs text-muted-foreground">+{purchase.items.length - 2} more item(s)</p>}
                        </div>
                    </div>
                ),
                debit: purchase.orderStatus !== 'Cancelled' ? purchase.totalAmount : 0,
                credit: purchase.orderStatus === 'Cancelled' ? purchase.totalAmount : 0,
                balance: 0,
                status: purchase.paymentStatus
            }));

            const paymentTransactions: Transaction[] = supplierPayments.map(payment => ({
                id: `payment-${payment.id}`,
                date: payment.date,
                type: 'Payment',
                description: `Payment - Ref ${payment.paymentId}`,
                debit: 0,
                credit: payment.amount,
                balance: 0,
                status: 'Paid'
            }));

            const combinedTransactions = [...purchaseTransactions, ...paymentTransactions]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let currentBalance = openingBalance;
            const processedTransactions: Transaction[] = combinedTransactions.map(t => {
                currentBalance = currentBalance + t.debit - t.credit;
                return { ...t, balance: currentBalance };
            });

            const openingBalanceTransaction: Transaction = {
              id: 'opening',
              date: supplierData.balanceDate || supplierData.createdDate || new Date().toISOString(),
              type: 'Payment',
              description: 'Opening Balance',
              debit: openingBalance > 0 ? openingBalance : 0,
              credit: openingBalance < 0 ? -openingBalance : 0,
              balance: openingBalance,
              status: 'Paid'
            };

            setTransactions([openingBalanceTransaction, ...processedTransactions]);
            
            const supplierWithStats: SupplierWithStats = {
                ...supplierData,
                currentBalance,
            };
            setSupplier(supplierWithStats);
            paymentForm.setValue('amount', currentBalance > 0 ? currentBalance : 0);

        } else {
            setError('Supplier not found.');
        }
    } catch (err) {
        console.error("Failed to fetch supplier data:", err);
        setError('Failed to load supplier details.');
    } finally {
        setLoading(false);
    }
  }


  useEffect(() => {
    fetchData();
  }, [id, currency]);
  
  const handlePrint = () => {
    window.print();
  }
  
  const onPaymentSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
    if (!supplier) return;
    setIsSubmittingPayment(true);
    try {
        await addSupplierPayment({
            supplierId: supplier.id!,
            supplierName: supplier.name,
            amount: values.amount,
            notes: values.notes,
            date: new Date().toISOString(),
            purchaseId: `PAY-SUP-${Date.now()}` 
        });
        toast({ title: "Success", description: "Payment to supplier recorded successfully." });
        paymentForm.reset({ amount: 0, notes: ''});
        await fetchData(); // Re-fetch all data to update the ledger
    } catch(err) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to record payment.' });
    } finally {
        setIsSubmittingPayment(false);
    }
  }

  if (loading) {
    return (
        <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>
            <div className="lg:col-span-2"><Skeleton className="h-96 w-full" /></div>
        </div>
    )
  }

  if (error) {
    return <Alert variant="destructive" className="print:hidden"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!supplier) return null;

  return (
    <>
      <div className="space-y-6">
          <div className="flex justify-between items-center print:hidden">
              <div>
                  <h1 className="text-2xl font-bold">Supplier: {supplier.name}</h1>
                  <p className="text-muted-foreground">Details and history for supplier ID {supplier.supplierId}</p>
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/>Back to Suppliers List</Button>
                  <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print Report</Button>
              </div>
          </div>
          <div className="text-center hidden print:block">
            <h2 className="text-xl font-bold">SUPPLIER STATEMENT</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-1 space-y-6 print:hidden">
                  <Card>
                      <CardHeader><CardTitle className="text-lg">Filter Transactions</CardTitle></CardHeader>
                      <CardContent>
                          <Label>Filter by Period</Label>
                          <Select defaultValue="all"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Time</SelectItem></SelectContent></Select>
                      </CardContent>
                  </Card>
                   <Card>
                      <CardHeader><CardTitle className="text-lg">Supplier Info</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-sm">
                          <p><strong>Contact Person:</strong> {supplier.contactPerson || 'N/A'}</p>
                          <p><strong>Email:</strong> {supplier.email}</p>
                          <p><strong>Phone:</strong> {supplier.phone || 'N/A'}</p>
                          <p><strong>Address:</strong> {supplier.address || 'N/A'}</p>
                           <Separator className="my-4"/>
                          <div>
                               <p className="text-muted-foreground">Opening Balance:</p>
                                <p className="font-semibold">{currency}{(supplier.initialBalance || 0).toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">As of: {new Date(supplier.balanceDate || supplier.createdDate!).toLocaleDateString()}</p>
                          </div>
                           <div>
                               <p className="text-muted-foreground">Current Balance:</p>
                               <p className="text-2xl font-bold text-destructive">{currency}{supplier.currentBalance.toFixed(2)}</p>
                          </div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader><CardTitle className="text-lg">Record Payment to Supplier</CardTitle></CardHeader>
                       <Form {...paymentForm}>
                            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}>
                               <CardContent className="space-y-4">
                                    <FormField
                                        control={paymentForm.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>Payment Amount ({currency})</Label>
                                                <FormControl><Input type="number" step="0.01" {...field} placeholder="e.g., 100.00" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={paymentForm.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>Payment Notes (Optional)</Label>
                                                <FormControl><Textarea placeholder="e.g., Bank transfer for INV-001" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                               </CardContent>
                               <CardFooter>
                                    <Button type="submit" className="w-full" disabled={isSubmittingPayment}>
                                        <Send className="mr-2 h-4 w-4"/>
                                        {isSubmittingPayment ? "Submitting..." : "Submit Payment"}
                                    </Button>
                               </CardFooter>
                            </form>
                       </Form>
                  </Card>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2">
                  <Card>
                      <CardHeader>
                          <CardTitle>Transaction History</CardTitle>
                          <CardDescription>Chronological list of purchase orders and payments for this supplier.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {transactions.length > 0 ? (
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead className="text-right">Debit ({currency})</TableHead>
                                      <TableHead className="text-right">Credit ({currency})</TableHead>
                                      <TableHead className="text-right">Balance After</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {transactions.map((t) => (
                                      <TableRow key={t.id}>
                                          <TableCell>{t.date ? new Date(t.date).toLocaleDateString() : ''}</TableCell>
                                          <TableCell>
                                              <Badge variant={t.type === 'Payment' ? 'default' : 'secondary'} className={cn({'bg-green-100 text-green-800 border-green-300': t.type === 'Payment', 'bg-blue-100 text-blue-800 border-blue-300': t.type === 'Purchase', 'bg-orange-100 text-orange-800 border-orange-300': t.type === 'Return'})}>
                                                  {t.type}
                                              </Badge>
                                          </TableCell>
                                          <TableCell>
                                              {t.description}
                                              {t.status && t.id !== 'opening' && <Badge variant="outline" className={cn('mt-1', {'bg-yellow-100 text-yellow-800 border-yellow-300': t.status === 'Partial', 'bg-green-100 text-green-800 border-green-300': t.status === 'Paid', 'bg-red-100 text-red-800 border-red-300': t.status === 'Unpaid'})}>{t.status}</Badge>}
                                          </TableCell>
                                          <TableCell className="text-right font-mono text-red-600">{t.debit > 0 ? `${t.debit.toFixed(2)}` : ''}</TableCell>
                                          <TableCell className="text-right font-mono text-green-600">{t.credit > 0 ? `${t.credit.toFixed(2)}` : ''}</TableCell>
                                          <TableCell className="text-right font-mono font-semibold">{`${t.balance.toFixed(2)}`}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                          ) : (
                              <p className="text-muted-foreground text-center py-8">No transaction history found for this supplier.</p>
                          )}
                      </CardContent>
                  </Card>
              </div>
          </div>
      </div>
    </>
  )
}

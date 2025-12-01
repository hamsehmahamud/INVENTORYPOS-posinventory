

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCustomerById, type Customer } from '@/services/customers';
import { getSales, type SaleWithItems } from '@/services/sales';
import { getPayments, addPayment, type Payment } from '@/services/payments';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, DollarSign, AlertCircle, ShoppingCart, Printer, ArrowLeft } from 'lucide-react';
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

interface CustomerWithStats extends Customer {
    customerId: string;
    currentBalance: number;
}

interface Transaction {
  id: string;
  date: string;
  type: 'Sale' | 'Payment' | 'Return' | 'Opening Balance';
  description: React.ReactNode;
  debit: number;
  credit: number;
  balance: number;
  status?: 'Paid' | 'On Account' | 'Returned' | 'Unpaid';
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be positive.'),
  notes: z.string().optional(),
});


const ReportContent = ({ reportData, companyInfo, currency, dateRange }: { reportData: { customer: Customer, transactions: Transaction[] }, companyInfo: any, currency: string, dateRange: DateRange | undefined }) => {
    return (
        <div id="report-content" className="bg-background text-foreground p-6 rounded-lg">
            <header className="text-center mb-6">
                {companyInfo && (
                    <>
                        <h1 className="text-3xl font-bold">{companyInfo.name || 'NCS BILLING BOOK'}</h1>
                        <p className="text-sm">{companyInfo.address || '63 Wanbrough Mansions'}</p>
                        <p className="text-sm">Phone: {companyInfo.phone || '+263712303070'}</p>
                        <p className="text-sm">Email: {companyInfo.email || 'sales@bbsupplies.co.zw'}</p>
                    </>
                )}
            </header>
            <div className="border-y-2 border-red-500 py-2 my-4">
                 <h2 className="text-center text-xl font-bold text-red-500">CUSTOMER STATEMENT</h2>
            </div>
            <div className="text-center mb-4">
                <p className="font-bold">Customer: {reportData.customer.name}</p>
                <p className="text-sm text-muted-foreground">
                    Period: {dateRange?.from ? format(dateRange.from, 'dd MMM, yyyy') : 'Start'} - {dateRange?.to ? format(dateRange.to, 'dd MMM, yyyy') : 'End'}
                </p>
            </div>
            
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>DATE</TableHead>
                        <TableHead>TYPE</TableHead>
                        <TableHead>REFERENCE</TableHead>
                        <TableHead>DESCRIPTION</TableHead>
                        <TableHead className="text-right">DEBIT</TableHead>
                        <TableHead className="text-right">CREDIT</TableHead>
                        <TableHead className="text-right">BALANCE</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.transactions.map(t => (
                        <TableRow key={t.id}>
                            <TableCell>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                            <TableCell>{t.type}</TableCell>
                            <TableCell>{t.reference}</TableCell>
                            <TableCell>{t.description}</TableCell>
                            <TableCell className="text-right font-semibold text-red-500">{t.debit > 0 ? `${currency}${t.debit.toFixed(2)}` : ''}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">{t.credit > 0 ? `${currency}${t.credit.toFixed(2)}` : ''}</TableCell>
                            <TableCell className="text-right font-bold">{`${currency}${t.balance.toFixed(2)}`}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <footer className="text-center text-xs text-muted-foreground mt-8">
                <p>Generated on: {format(new Date(), 'dd/MM/yyyy, hh:mm:ss a')}</p>
                <p>This is a computer generated report</p>
            </footer>
        </div>
    )
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [customer, setCustomer] = useState<CustomerWithStats | null>(null);
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
        setError('No customer ID provided.');
        setLoading(false);
        return;
    }
    try {
        setLoading(true);
        setError(null);
        
        const [customerData, allSales, allPayments] = await Promise.all([
            getCustomerById(id),
            getSales(),
            getPayments()
        ]);
        
        if (customerData) {
            const customerSales = allSales.filter(sale => sale.customerId === customerData.id);
            const customerPayments = allPayments.filter(p => p.customerId === customerData.id);

            const openingBalance = customerData.openingBalance || 0;

            const salesTransactions: Transaction[] = customerSales.map(sale => {
                const totalPaidForSale = allPayments
                    .filter(p => p.invoiceId === sale.orderId)
                    .reduce((acc, p) => acc + p.amount, 0);
                
                let saleStatus: 'Paid' | 'On Account' | 'Returned' = 'On Account';
                if (sale.status === 'Return') saleStatus = 'Returned';
                else if (totalPaidForSale >= sale.total) saleStatus = 'Paid';
                
                return {
                    id: `sale-${sale.id}`,
                    date: sale.date,
                    type: sale.status === 'Return' ? 'Return' : 'Sale',
                    description: (
                        <div>
                            <p>{sale.status === 'Return' ? 'Return for' : 'Sale'} - Invoice {sale.orderId}</p>
                            <div className="pl-4">
                            {sale.items.map(item => (
                                <p key={item.itemId} className="text-xs">
                                    {item.name}, Qty: {item.quantity}, @ {currency}{item.price.toFixed(2)}
                                </p>
                            ))}
                            </div>
                        </div>
                    ),
                    debit: sale.status !== 'Return' ? sale.total : 0,
                    credit: sale.status === 'Return' ? sale.total : 0,
                    balance: 0,
                    status: saleStatus,
                    reference: sale.orderId,
                };
            });

            const paymentTransactions: Transaction[] = customerPayments.map(payment => ({
                id: `payment-${payment.id}`,
                date: payment.date,
                type: 'Payment',
                description: `Payment - Ref ${payment.paymentId}`,
                debit: 0,
                credit: payment.amount,
                balance: 0,
                status: 'Paid',
                reference: payment.paymentId,
            }));
            
            const openingBalanceTransaction: Transaction = {
                id: 'opening', 
                date: customerData.balanceDate || customerData.registered, 
                type: 'Opening Balance', 
                description: 'Opening Balance', 
                debit: openingBalance, 
                credit: 0,
                balance: openingBalance,
                reference: 'N/A'
            };

            const combinedTransactions = [openingBalanceTransaction, ...salesTransactions, ...paymentTransactions]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let currentBalance = 0;
            const processedTransactions: Transaction[] = combinedTransactions.map(t => {
                if (t.id === 'opening') {
                    currentBalance = t.balance;
                } else {
                    currentBalance = currentBalance + t.debit - t.credit;
                }
                return { ...t, balance: currentBalance };
            });

            setTransactions(processedTransactions);
            
            const customerWithStats: CustomerWithStats = {
                ...customerData,
                customerId: `CU${customerData.id?.substring(0,6).toUpperCase()}`,
                currentBalance,
            };
            setCustomer(customerWithStats);
            paymentForm.setValue('amount', currentBalance > 0 ? currentBalance : 0);

        } else {
            setError('Customer not found.');
        }
    } catch (err) {
        console.error("Failed to fetch customer data:", err);
        setError('Failed to load customer details.');
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
    if (!customer) return;
    setIsSubmittingPayment(true);
    try {
        await addPayment({
            customerId: customer.id!,
            customerName: customer.name,
            amount: values.amount,
            notes: values.notes,
            date: new Date().toISOString(),
            invoiceId: `PAY-${Date.now()}`
        });
        toast({ title: "Success", description: "Payment recorded successfully." });
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
        <div className="space-y-6">
             <Skeleton className="h-9 w-48" />
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  if (error) {
    return <Alert variant="destructive" className="print:hidden"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!customer) return null;

  return (
    <>
      <div className="space-y-6 print:hidden">
          <div className="flex justify-between items-center">
              <div>
                  <h1 className="text-2xl font-bold">Customer: {customer.name}</h1>
                  <p className="text-muted-foreground">Details and transaction history for customer ID {customer.customerId}</p>
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/>Back to Customers List</Button>
                  <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print Statement</Button>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-1 space-y-6">
                  <Card>
                      <CardHeader><CardTitle className="text-lg">Filter Transactions</CardTitle></CardHeader>
                      <CardContent>
                          <Label>Filter by Period</Label>
                          <Select defaultValue="all"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Time</SelectItem></SelectContent></Select>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader><CardTitle className="text-lg">Contact</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-sm">
                          <p><strong>Email:</strong> {customer.email}</p>
                          <p><strong>Phone:</strong> {customer.phone}</p>
                          <p><strong>Address:</strong> {customer.address || 'N/A'}</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader><CardTitle className="text-lg">Financials</CardTitle></CardHeader>
                       <Form {...paymentForm}>
                            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}>
                               <CardContent className="space-y-4">
                                  <div>
                                      <p className="text-muted-foreground">Current Balance:</p>
                                      <p className="text-2xl font-bold text-destructive">{currency}{customer.currentBalance.toFixed(2)}</p>
                                  </div>
                                   <Separator/>
                                   <h4 className="font-semibold">Record Payment</h4>
                                    <FormField
                                        control={paymentForm.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>Payment Amount ({currency})</Label>
                                                <FormControl><Input type="number" step="0.01" {...field} placeholder="e.g., 50.00" /></FormControl>
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
                                                <FormControl><Textarea placeholder="e.g., Cash payment" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                               </CardContent>
                               <CardFooter>
                                    <Button type="submit" className="w-full" disabled={isSubmittingPayment}>
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
                          <CardDescription>Chronological list of sales and payments for this customer.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {transactions.length > 1 ? ( // >1 to account for opening balance
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead className="text-right">Debit</TableHead>
                                      <TableHead className="text-right">Credit</TableHead>
                                      <TableHead className="text-right">Balance After</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {transactions.map((t) => (
                                      <TableRow key={t.id}>
                                          <TableCell>{t.date ? new Date(t.date).toLocaleDateString() : ''}</TableCell>
                                          <TableCell>
                                            {t.id !== 'opening' && (
                                              <Badge variant={t.type === 'Payment' ? 'default' : 'secondary'} className={cn({'bg-green-100 text-green-800 border-green-300': t.type === 'Payment', 'bg-blue-100 text-blue-800 border-blue-300': t.type === 'Sale', 'bg-orange-100 text-orange-800 border-orange-300': t.type === 'Return'})}>
                                                  {t.type}
                                              </Badge>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                              {t.description}
                                              {t.status && t.id !== 'opening' && <Badge variant="outline" className={cn('mt-1', {'bg-yellow-100 text-yellow-800 border-yellow-300': t.status === 'On Account' || t.status === 'Unpaid', 'bg-green-100 text-green-800 border-green-300': t.status === 'Paid', 'bg-orange-100 text-orange-800 border-orange-300': t.status === 'Returned'})}>{t.status}</Badge>}
                                          </TableCell>
                                          <TableCell className="text-right font-mono">{t.debit > 0 ? `${currency}${t.debit.toFixed(2)}` : ''}</TableCell>
                                          <TableCell className="text-right font-mono text-green-600">{t.credit > 0 ? `${currency}${t.credit.toFixed(2)}` : ''}</TableCell>
                                          <TableCell className="text-right font-mono font-semibold">{`${currency}${t.balance.toFixed(2)}`}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                          ) : (
                              <p className="text-muted-foreground text-center py-8">No transaction history found for this customer.</p>
                          )}
                      </CardContent>
                  </Card>
              </div>
          </div>
      </div>
      <div className="printable-area hidden print:block">
         <div id="report-content-for-print" className="max-w-4xl mx-auto p-8 bg-white text-black font-sans">
              <header className="flex justify-between items-start pb-4 mb-4">
                  <div>
                      {companyInfo?.logo && (
                          <Image src={companyInfo.logo} alt="Company Logo" width={100} height={40} className="mb-2 object-contain" data-ai-hint="company logo" />
                      )}
                      <h1 className="text-2xl font-bold">{companyInfo?.name}</h1>
                      <p className="text-xs">{companyInfo?.address}</p>
                  </div>
                  <div className="text-right">
                      <h2 className="text-xl uppercase font-bold">Customer Statement</h2>
                      <p className="text-xs">Generated: {new Date().toLocaleDateString()}</p>
                      <div className="mt-4">
                        <p className="text-xs">Bill To:</p>
                        <p className="text-base font-bold">{customer.name}</p>
                      </div>
                  </div>
              </header>

              <section>
                  <Table>
                      <TableHeader>
                          <TableRow className="border-0">
                              <TableHead className="py-2 text-black text-xs">Date</TableHead>
                              <TableHead className="py-2 text-black text-xs">Type</TableHead>
                              <TableHead className="py-2 w-[40%] text-black text-xs">Description</TableHead>
                              <TableHead className="text-right py-2 text-black text-xs">Debit ({currency})</TableHead>
                              <TableHead className="text-right py-2 text-black text-xs">Credit ({currency})</TableHead>
                              <TableHead className="text-right py-2 text-black text-xs">Balance</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {transactions.map((t) => (
                              <TableRow key={t.id} className="border-0">
                                  <TableCell className="py-1 text-xs text-black">{t.date ? new Date(t.date).toLocaleDateString() : ''}</TableCell>
                                  <TableCell className="py-1 text-xs text-black">
                                      {t.id !== 'opening' && t.type}
                                  </TableCell>
                                  <TableCell className="py-1 text-xs text-black">
                                      <div className="text-black">{t.description}</div>
                                      {t.status && t.id !== 'opening' && <span className="text-xs mt-1 text-black">({t.status})</span>}
                                  </TableCell>
                                  <TableCell className="text-right py-1 font-mono text-xs text-red-600">{t.debit > 0 ? t.debit.toFixed(2) : '-'}</TableCell>
                                  <TableCell className="text-right py-1 font-mono text-xs text-green-600">{t.credit > 0 ? t.credit.toFixed(2) : '-'}</TableCell>
                                  <TableCell className="text-right py-1 font-mono text-xs text-black">{t.balance.toFixed(2)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </section>

              <footer className="text-center text-xs text-black mt-8 pt-4">
                <p>Thank you for your business!</p>
              </footer>
          </div>
      </div>
    </>
  )
}

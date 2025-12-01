
'use client';

import {
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Eye,
  Trash2,
  Printer,
  PlusCircle,
  Pencil,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/company-context';
import { getSupplierPayments, deleteSupplierPayment, type SupplierPayment } from '@/services/supplier-payments';
import { getSuppliers, type Supplier } from '@/services/suppliers';
import { getPurchases, type Purchase } from '@/services/purchases';


export default function SupplierPaymentsListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currency = companyInfo?.currencySymbol || '$';
  
  async function fetchPayments() {
      setLoading(true);
      try {
          const [fetchedPayments, fetchedSuppliers, fetchedPurchases] = await Promise.all([
            getSupplierPayments(),
            getSuppliers(),
            getPurchases()
          ]);
          setPayments(fetchedPayments);
          setSuppliers(fetchedSuppliers);
          setPurchases(fetchedPurchases);
      } catch(err) {
          toast({ variant: "destructive", title: "Error", description: "Failed to load supplier payment data." });
      } finally {
          setLoading(false);
      }
  }

  useEffect(() => {
      fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const paymentDate = new Date(payment.date);
      const fromDateMatch = fromDate ? paymentDate >= fromDate : true;
      const toDateMatch = toDate ? paymentDate <= toDate : true;
      const supplierMatch = selectedSupplier === 'all' || payment.supplierId === selectedSupplier;
      const searchMatch = !searchTerm || 
        payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        payment.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        payment.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      return fromDateMatch && toDateMatch && supplierMatch && searchMatch;
    });
  }, [payments, fromDate, toDate, selectedSupplier, searchTerm]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
        await deleteSupplierPayment(id);
        toast({ title: 'Success', description: 'Payment deleted successfully.' });
        await fetchPayments();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete payment.' });
    } finally {
        setIsDeleting(false);
    }
  };

  const handleViewDetails = (purchaseId: string) => {
    const purchase = purchases.find(p => p.purchaseId === purchaseId);
    if(purchase && purchase.id) {
      router.push(`/purchase/${purchase.id}`)
    } else {
      toast({ title: 'Not Found', description: `Purchase order with ID ${purchaseId} not found.` });
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Supplier Payments List</h1><p className="text-muted-foreground">View and manage all payments made to suppliers.</p></div>
        <Button asChild><Link href="/accounting/supplier-payments/new"><PlusCircle className="h-4 w-4 mr-2" />New Payment</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Supplier</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}><SelectTrigger><SelectValue placeholder="All Suppliers" /></SelectTrigger><SelectContent><SelectItem value="all">All Suppliers</SelectItem>{suppliers.map(s => <SelectItem key={s.id!} value={s.id!}>{s.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-2"><label htmlFor="from-date">From Date</label>
              <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !fromDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid gap-2"><label htmlFor="to-date">To Date</label>
              <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !toDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus /></PopoverContent></Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><div className="flex items-center justify-between"><CardTitle>All Payments</CardTitle><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Payment ID</TableHead><TableHead>Purchase ID</TableHead><TableHead>Supplier</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead><TableHead>Notes</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-28" /></TableCell><TableCell><Skeleton className="h-5 w-28" /></TableCell><TableCell><Skeleton className="h-5 w-32" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-40" /></TableCell><TableCell><div className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                ))
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}><TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell><TableCell>{payment.paymentId}</TableCell><TableCell>{payment.purchaseId}</TableCell><TableCell>{payment.supplierName}</TableCell><TableCell>{payment.paymentMethod}</TableCell><TableCell className="font-medium">{currency}{payment.amount.toFixed(2)}</TableCell><TableCell>{payment.notes || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(payment.purchaseId)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/accounting/supplier-payments/${payment.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                           <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the payment record.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(payment.id!)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import {
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

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
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/context/company-context';
import type { Purchase } from '@/services/purchases';
import { getPurchases, deletePurchase } from '@/services/purchases';
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

export default function BillsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const [bills, setBills] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currency = companyInfo?.currencySymbol || '$';
  
  async function fetchBills() {
    setLoading(true);
    try {
        const purchases = await getPurchases();
        setBills(purchases);
    } catch(err) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch supplier bills.' });
    } finally {
        setLoading(false);
    }
  }
  
  useEffect(() => {
    fetchBills();
  }, [toast]);


  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const billDate = new Date(bill.date);
      const fromDateMatch = fromDate ? billDate >= fromDate : true;
      const toDateMatch = toDate ? billDate <= toDate : true;
      const supplierMatch = selectedSupplier === 'all' || bill.supplier === selectedSupplier;
      const searchMatch = !searchTerm || bill.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()) || bill.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      return fromDateMatch && toDateMatch && supplierMatch && searchMatch;
    });
  }, [bills, fromDate, toDate, selectedSupplier, searchTerm]);
  
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
        await deletePurchase(id);
        toast({ title: 'Success', description: 'Bill deleted successfully.' });
        await fetchBills();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete bill.' });
    } finally {
        setIsDeleting(false);
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Bills</h1>
          <p className="text-muted-foreground">Manage and track bills from your suppliers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
             <div className="grid gap-2">
              <label className="text-sm font-medium">Supplier</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger><SelectValue placeholder="All Suppliers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {[...new Set(bills.map(b => b.supplier))].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="from-date">From Date</label>
              <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal',!fromDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid gap-2">
              <label htmlFor="to-date">To Date</label>
              <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal',!toDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus /></PopoverContent></Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Bills</CardTitle>
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by Bill ID, Supplier..." className="pl-8 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Bill ID</TableHead><TableHead>Supplier</TableHead><TableHead>Total Amount</TableHead><TableHead>Paid</TableHead><TableHead>Due</TableHead><TableHead>Payment Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-32" /></TableCell><TableCell><Skeleton className="h-5 w-28" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-6 w-20" /></TableCell><TableCell><div className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                ))
              ) : (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id}><TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell><TableCell>{bill.purchaseId}</TableCell><TableCell>{bill.supplier}</TableCell><TableCell>{currency}{bill.totalAmount.toFixed(2)}</TableCell><TableCell className="text-green-600">{currency}{bill.paidAmount.toFixed(2)}</TableCell><TableCell className="text-red-600">{currency}{bill.dueAmount.toFixed(2)}</TableCell><TableCell><Badge variant="outline" className={cn({'bg-green-100 text-green-800 border-green-300': bill.paymentStatus === 'Paid', 'bg-red-100 text-red-800 border-red-300': bill.paymentStatus === 'Unpaid', 'bg-yellow-100 text-yellow-800 border-yellow-300': bill.paymentStatus === 'Partial'})}>{bill.paymentStatus}</Badge></TableCell><TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/purchase/${bill.id}`)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/purchase/${bill.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the bill.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(bill.id!)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
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

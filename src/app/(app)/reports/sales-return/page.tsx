

'use client';

import { FileText, DollarSign, Calendar as CalendarIcon, Search, Filter } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getSales, type Sale } from '@/services/sales';
import { getCustomers, type Customer } from '@/services/customers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/context/company-context';

export default function SalesReturnReportPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [fetchedSales, fetchedCustomers] = await Promise.all([
          getSales(),
          getCustomers(),
        ]);
        // Filtering for returns
        setSales(fetchedSales.filter(p => p.status === 'Return'));
        setCustomers(fetchedCustomers);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load sales return data.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const filteredReturns = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      const fromDateMatch = fromDate ? saleDate >= fromDate : true;
      const toDateMatch = toDate ? saleDate <= toDate : true;
      const customerMatch = selectedCustomer === 'all' || sale.customer === customers.find(c => c.id === selectedCustomer)?.name;
      const searchMatch = !searchTerm ||
        sale.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.toLowerCase().includes(searchTerm.toLowerCase());
      return fromDateMatch && toDateMatch && customerMatch && searchMatch;
    });
  }, [sales, fromDate, toDate, selectedCustomer, searchTerm, customers]);

  return (
    <div className="flex flex-col gap-6">
       <CardHeader className="p-0">
          <CardTitle>Sales Return Report</CardTitle>
          <CardDescription>View and analyze your sales return history.</CardDescription>
        </CardHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger><SelectValue placeholder="All Customers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((c) => <SelectItem key={c.id!} value={c.id!}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
              <label htmlFor="from-date">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !fromDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <label htmlFor="to-date">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !toDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Return Details</CardTitle>
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by Order ID, Customer..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredReturns.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>{sale.orderId}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell className="text-right">{currency}{sale.total.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant="destructive">{sale.status}</Badge>
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

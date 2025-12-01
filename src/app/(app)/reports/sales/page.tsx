'use client';

import {
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Printer,
  Columns3,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSales,
  type Sale,
} from '@/services/sales';
import { getCustomers, type Customer } from '@/services/customers';
import { getUsers, type User } from '@/services/users';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  TableFooter,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

declare module "jspdf" {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

interface SaleWithDetails extends Sale {
    paidPayment: number;
    due: number;
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
    referenceNo?: string;
    createdBy: string;
}

export default function SalesReportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currency = companyInfo?.currencySymbol || '$';
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedSales, fetchedCustomers, fetchedUsers] = await Promise.all([
            getSales(),
            getCustomers(),
            getUsers()
        ]);
        
        const enhancedSales = fetchedSales.map(sale => {
            const isPaid = sale.status === 'Fulfilled';
            const paidPayment = isPaid ? sale.total : 0;
            const due = isPaid ? 0 : sale.total;
            let paymentStatus: 'Paid' | 'Unpaid' | 'Partial' = isPaid ? 'Paid' : 'Unpaid';
             if (!isPaid && sale.status !== 'Return' && sale.status !== 'Cancelled') {
                paymentStatus = 'Unpaid';
            }
            
            const creator = fetchedUsers.find(u => u.name === 'Admin User') 
            
            return {
                ...sale,
                paidPayment: paidPayment < 0 ? 0 : paidPayment,
                due: due > 0 ? due : 0,
                paymentStatus,
                referenceNo: `REF-${sale.orderId.split('-')[1]}`,
                createdBy: creator?.name || 'Admin', 
            }
        });

        setSales(enhancedSales);
        setCustomers(fetchedCustomers);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      const fromDateMatch = fromDate ? saleDate >= fromDate : true;
      const toDateMatch = toDate ? saleDate <= toDate : true;
      const customerMatch = selectedCustomer === 'all' || sale.customer === customers.find(c => c.id === selectedCustomer)?.name;
      const userMatch = selectedUser === 'all' || sale.createdBy === users.find(u => u.id === selectedUser)?.name;
      const searchMatch =
        !searchTerm ||
        sale.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.toLowerCase().includes(searchTerm.toLowerCase());

      return fromDateMatch && toDateMatch && customerMatch && userMatch && searchMatch;
    });
  }, [sales, fromDate, toDate, selectedCustomer, selectedUser, searchTerm, customers, users]);

  const summary = useMemo(() => ({
    totalSales: filteredSales.length,
    totalAmount: filteredSales.reduce((acc, p) => acc + p.total, 0),
    totalPaid: filteredSales.reduce((acc, p) => acc + p.paidPayment, 0),
    totalDue: filteredSales.reduce((acc, p) => acc + p.due, 0),
  }), [filteredSales]);

  const getTableData = () => {
    const data = filteredSales.map(s => ({
      'Date': new Date(s.date).toLocaleDateString(),
      'Order ID': s.orderId,
      'Customer': s.customer,
      'Total Amount': s.total.toFixed(2),
      'Paid': s.paidPayment.toFixed(2),
      'Due': s.due.toFixed(2),
      'Status': s.status,
      'Payment Status': s.paymentStatus,
    }));
    data.push({
        'Date': 'Total',
        'Order ID': '',
        'Customer': '',
        'Total Amount': summary.totalAmount.toFixed(2),
        'Paid': summary.totalPaid.toFixed(2),
        'Due': summary.totalDue.toFixed(2),
        'Status': '',
        'Payment Status': '',
    });
    return data;
  };

  const handleCopy = () => {
    const data = getTableData();
    const tsv = Papa.unparse(data, { delimiter: "\t" });
    navigator.clipboard.writeText(tsv).then(() => {
      toast({ title: "Success", description: "Table data copied to clipboard." });
    });
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const data = getTableData();
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales-report.${format}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdfExport = () => {
    const doc = new jsPDF();
    doc.text("Sales Report", 14, 16);
    doc.autoTable({
        head: [['Date', 'Order ID', 'Customer', 'Total', 'Paid', 'Due', 'Status', 'Payment Status']],
        body: filteredSales.map(s => [
            new Date(s.date).toLocaleDateString(),
            s.orderId,
            s.customer,
            `${currency}${s.total.toFixed(2)}`,
            `${currency}${s.paidPayment.toFixed(2)}`,
            `${currency}${s.due.toFixed(2)}`,
            s.status,
            s.paymentStatus,
        ]),
        foot: [
            ['Total', '', '', `${currency}${summary.totalAmount.toFixed(2)}`, `${currency}${summary.totalPaid.toFixed(2)}`, `${currency}${summary.totalDue.toFixed(2)}`, '', '']
        ],
        startY: 20,
        footStyles: { fontStyle: 'bold', fillColor: [230, 230, 230] }
    });
    doc.save('sales-report.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
       <CardHeader className="p-0">
          <CardTitle>Sales Report</CardTitle>
          <CardDescription>View and analyze your sales history.</CardDescription>
        </CardHeader>

      <div className="grid gap-4 md:grid-cols-4 print:hidden">
        <Card className="col-span-1 bg-blue-500 text-white"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Sales</CardTitle><FileText className="h-4 w-4 text-white/80" /></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12 bg-white/20" /> : summary.totalSales}</div></CardContent></Card>
        <Card className="col-span-1 bg-green-500 text-white"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Amount</CardTitle><DollarSign className="h-4 w-4 text-white/80" /></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : `${currency}${summary.totalAmount.toFixed(2)}`}</div></CardContent></Card>
         <Card className="col-span-1 bg-orange-500 text-white"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Paid</CardTitle><DollarSign className="h-4 w-4 text-white/80" /></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : `${currency}${summary.totalPaid.toFixed(2)}`}</div></CardContent></Card>
         <Card className="col-span-1 bg-red-500 text-white"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Due</CardTitle><DollarSign className="h-4 w-4 text-white/80" /></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : `${currency}${summary.totalDue.toFixed(2)}`}</div></CardContent></Card>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}><SelectTrigger><SelectValue placeholder="All Customers" /></SelectTrigger><SelectContent><SelectItem value="all">All Customers</SelectItem>{customers.map((c) => (<SelectItem key={c.id!} value={c.id!}>{c.name}</SelectItem>))}</SelectContent></Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Created by</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}><SelectTrigger><SelectValue placeholder="All Users" /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem>{users.map((u) => (<SelectItem key={u.id!} value={u.name}>{u.name}</SelectItem>))}</SelectContent></Select>
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
            <CardTitle>Sales Details</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>Excel</Button>
              <Button variant="outline" size="sm" onClick={handlePdfExport}>PDF</Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>Print</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>CSV</Button>
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8 w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Total Amount</TableHead><TableHead>Paid</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Payment Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-32" /></TableCell><TableCell><Skeleton className="h-5 w-28" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell></TableRow>
                ))
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}><TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell><TableCell>{sale.orderId}</TableCell><TableCell>{sale.customer}</TableCell><TableCell>{currency}{sale.total.toFixed(2)}</TableCell><TableCell>{currency}{sale.paidPayment.toFixed(2)}</TableCell><TableCell>{currency}{sale.due.toFixed(2)}</TableCell><TableCell><Badge variant="outline" className={cn({'bg-green-100 text-green-800 border-green-300': sale.status === 'Fulfilled','bg-yellow-100 text-yellow-800 border-yellow-300': sale.status === 'Pending','bg-red-100 text-red-800 border-red-300': sale.status === 'Cancelled' || sale.status === 'Return',})}>{sale.status}</Badge></TableCell><TableCell><Badge variant="outline" className={cn({'bg-green-100 text-green-800 border-green-300': sale.paymentStatus === 'Paid','bg-red-100 text-red-800 border-red-300': sale.paymentStatus === 'Unpaid','bg-yellow-100 text-yellow-800 border-yellow-300': sale.paymentStatus === 'Partial'})}>{sale.paymentStatus}</Badge></TableCell></TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                <TableCell className="font-bold">{currency}{summary.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="font-bold">{currency}{summary.totalPaid.toFixed(2)}</TableCell>
                <TableCell className="font-bold">{currency}{summary.totalDue.toFixed(2)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

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
  getPurchases,
  type Purchase,
  getSuppliers,
  type Supplier,
} from '@/services/purchases';
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

export default function PurchaseReportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [
          fetchedPurchases,
          fetchedSuppliers,
          fetchedUsers,
        ] = await Promise.all([
          getPurchases(),
          getSuppliers(),
          getUsers(),
        ]);

        setPurchases(fetchedPurchases);
        setSuppliers(fetchedSuppliers);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load purchase report data.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const purchaseDate = new Date(purchase.date);
      const fromDateMatch = fromDate ? purchaseDate >= fromDate : true;
      const toDateMatch = toDate ? purchaseDate <= toDate : true;
      const supplierMatch =
        selectedSupplier === 'all' || purchase.supplierId === selectedSupplier;
      const userMatch = selectedUser === 'all' || purchase.createdBy === selectedUser;
      const searchMatch =
        !searchTerm ||
        purchase.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase());

      return fromDateMatch && toDateMatch && supplierMatch && userMatch && searchMatch;
    });
  }, [purchases, fromDate, toDate, selectedSupplier, selectedUser, searchTerm]);

  const summary = useMemo(() => ({
    totalPurchases: filteredPurchases.length,
    totalAmount: filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0),
    totalPaid: filteredPurchases.reduce((acc, p) => acc + p.paidAmount, 0),
    totalDue: filteredPurchases.reduce((acc, p) => acc + p.dueAmount, 0),
  }), [filteredPurchases]);

  const getTableData = () => {
    const data = filteredPurchases.map(p => ({
      'Date': new Date(p.date).toLocaleDateString(),
      'Purchase ID': p.purchaseId,
      'Supplier': p.supplier,
      'Total Amount': p.totalAmount.toFixed(2),
      'Paid': p.paidAmount.toFixed(2),
      'Due': p.dueAmount.toFixed(2),
      'Order Status': p.orderStatus,
      'Created By': p.createdBy
    }));
    data.push({
      'Date': 'Total',
      'Purchase ID': '',
      'Supplier': '',
      'Total Amount': summary.totalAmount.toFixed(2),
      'Paid': summary.totalPaid.toFixed(2),
      'Due': summary.totalDue.toFixed(2),
      'Order Status': '',
      'Created By': ''
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
    link.setAttribute("download", `purchase-report.${format}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdfExport = () => {
    const doc = new jsPDF();
    doc.text("Purchase Report", 14, 16);
    doc.autoTable({
        head: [['Date', 'Purchase ID', 'Supplier', 'Total', 'Paid', 'Due', 'Status', 'Created By']],
        body: filteredPurchases.map(p => [
            new Date(p.date).toLocaleDateString(),
            p.purchaseId,
            p.supplier,
            `${currency}${p.totalAmount.toFixed(2)}`,
            `${currency}${p.paidAmount.toFixed(2)}`,
            `${currency}${p.dueAmount.toFixed(2)}`,
            p.orderStatus,
            p.createdBy
        ]),
        foot: [
            ['Total', '', '', `${currency}${summary.totalAmount.toFixed(2)}`, `${currency}${summary.totalPaid.toFixed(2)}`, `${currency}${summary.totalDue.toFixed(2)}`, '', '']
        ],
        startY: 20,
        footStyles: { fontStyle: 'bold', fillColor: [230, 230, 230] }
    });
    doc.save('purchase-report.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
       <CardHeader className="p-0">
          <CardTitle>Purchase Report</CardTitle>
          <CardDescription>View and analyze your purchase history.</CardDescription>
        </CardHeader>

      <div className="grid gap-4 md:grid-cols-4 print:hidden">
        <Card className="col-span-1 bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Purchases</CardTitle><FileText className="h-4 w-4 text-white/80" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12 bg-white/20" /> : summary.totalPurchases}</div></CardContent>
        </Card>
        <Card className="col-span-1 bg-green-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Amount</CardTitle><DollarSign className="h-4 w-4 text-white/80" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : `${currency}${summary.totalAmount.toFixed(2)}`}</div></CardContent>
        </Card>
         <Card className="col-span-1 bg-orange-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Paid</CardTitle><DollarSign className="h-4 w-4 text-white/80" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : `${currency}${summary.totalPaid.toFixed(2)}`}</div></CardContent>
        </Card>
         <Card className="col-span-1 bg-red-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Due</CardTitle><DollarSign className="h-4 w-4 text-white/80" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : `${currency}${summary.totalDue.toFixed(2)}`}</div></CardContent>
        </Card>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Supplier</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}><SelectTrigger><SelectValue placeholder="All Suppliers" /></SelectTrigger><SelectContent><SelectItem value="all">All Suppliers</SelectItem>{suppliers.map((s) => (<SelectItem key={s.id!} value={s.id!}>{s.name}</SelectItem>))}</SelectContent></Select>
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
            <CardTitle>Purchase Details</CardTitle>
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
              <TableRow><TableHead>Date</TableHead><TableHead>Purchase ID</TableHead><TableHead>Supplier</TableHead><TableHead>Total Amount</TableHead><TableHead>Paid</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-32" /></TableCell><TableCell><Skeleton className="h-5 w-28" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell></TableRow>
                ))
              ) : (
                filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}><TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell><TableCell>{purchase.purchaseId}</TableCell><TableCell>{purchase.supplier}</TableCell><TableCell>{currency}{purchase.totalAmount.toFixed(2)}</TableCell><TableCell>{currency}{purchase.paidAmount.toFixed(2)}</TableCell><TableCell>{currency}{purchase.dueAmount.toFixed(2)}</TableCell><TableCell><Badge variant="outline" className={cn({'bg-green-100 text-green-800 border-green-300': purchase.orderStatus === 'Received','bg-yellow-100 text-yellow-800 border-yellow-300': purchase.orderStatus === 'Pending',})}>{purchase.orderStatus}</Badge></TableCell><TableCell>{purchase.createdBy}</TableCell></TableRow>
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

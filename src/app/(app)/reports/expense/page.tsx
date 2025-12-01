'use client';

import {
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Columns3,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getExpenses,
  type Expense,
  getExpenseCategories,
  type ExpenseCategory,
} from '@/services/expenses';
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
import { useCompany } from '@/context/company-context';

declare module "jspdf" {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

export default function ExpenseReportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('all');
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
          fetchedExpenses,
          fetchedCategories,
          fetchedUsers,
        ] = await Promise.all([
          getExpenses(),
          getExpenseCategories(),
          getUsers(),
        ]);

        setExpenses(fetchedExpenses);
        setCategories(fetchedCategories);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load expense report data.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const fromDateMatch = fromDate ? expenseDate >= fromDate : true;
      const toDateMatch = toDate ? expenseDate <= toDate : true;
      const categoryMatch =
        selectedCategory === 'all' || expense.category === selectedCategory;
      const userMatch = selectedUser === 'all' || expense.createdBy === selectedUser;
      const searchMatch =
        !searchTerm ||
        expense.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.notes && expense.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      return fromDateMatch && toDateMatch && categoryMatch && userMatch && searchMatch;
    });
  }, [expenses, fromDate, toDate, selectedCategory, selectedUser, searchTerm]);

  const summary = useMemo(() => ({
    totalInvoices: filteredExpenses.length,
    totalAmount: filteredExpenses.reduce((acc, p) => acc + p.amount, 0),
  }), [filteredExpenses]);

  const getTableData = () => {
    const data = filteredExpenses.map(e => ({
        'Date': new Date(e.date).toLocaleDateString(),
        'Reference No.': e.referenceNo,
        'Category': e.category,
        'Amount': e.amount.toFixed(2),
        'Notes': e.notes || 'N/A',
        'Created By': e.createdBy
    }));
    data.push({
        'Date': 'Total',
        'Reference No.': '',
        'Category': '',
        'Amount': summary.totalAmount.toFixed(2),
        'Notes': '',
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
    link.setAttribute("download", `expense-report.${format}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdfExport = () => {
    const doc = new jsPDF();
    doc.text("Expense Report", 14, 16);
    doc.autoTable({
        head: [['Date', 'Reference No.', 'Category', 'Amount', 'Notes', 'Created By']],
        body: filteredExpenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.referenceNo,
            e.category,
            `${currency}${e.amount.toFixed(2)}`,
            e.notes || 'N/A',
            e.createdBy
        ]),
        foot: [
            ['Total', '', '', `${currency}${summary.totalAmount.toFixed(2)}`, '', '']
        ],
        startY: 20,
        footStyles: { fontStyle: 'bold', fillColor: [230, 230, 230] }
    });
    doc.save('expense-report.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
       <CardHeader className="p-0">
          <CardTitle>Expense Report</CardTitle>
          <CardDescription>View and analyze your business expenses.</CardDescription>
        </CardHeader>

       <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Invoices</CardTitle><FileText className="h-4 w-4 text-white/80" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12 bg-white/20" /> : summary.totalInvoices}</div></CardContent>
        </Card>
        <Card className="bg-green-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Expense Amount</CardTitle><DollarSign className="h-4 w-4 text-white/80" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : `${currency}${summary.totalAmount.toFixed(2)}`}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}><SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map((c) => (<SelectItem key={c.id!} value={c.name}>{c.name}</SelectItem>))}</SelectContent></Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Created by</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}><SelectTrigger><SelectValue placeholder="All Users" /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem>{users.map((u) => (<SelectItem key={u.id!} value={u.name}>{u.name}</SelectItem>))}</SelectContent></Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="from-date">From Date</label>
              <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !fromDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid gap-2">
              <label htmlFor="to-date">To Date</label>
              <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !toDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus /></PopoverContent></Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense Details</CardTitle>
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
              <TableRow><TableHead>Date</TableHead><TableHead>Reference No.</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Notes</TableHead><TableHead>Created By</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-32" /></TableCell><TableCell><Skeleton className="h-5 w-28" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-40" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell></TableRow>
                ))
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}><TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell><TableCell>{expense.referenceNo}</TableCell><TableCell>{expense.category}</TableCell><TableCell>{currency}{expense.amount.toFixed(2)}</TableCell><TableCell>{expense.notes || 'N/A'}</TableCell><TableCell>{expense.createdBy}</TableCell></TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                    <TableCell className="font-bold">{currency}{summary.totalAmount.toFixed(2)}</TableCell>
                    <TableCell colSpan={2}></TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

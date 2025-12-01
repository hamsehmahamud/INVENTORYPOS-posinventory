
"use client";

import { Eye, Pencil, PlusCircle, Search, Trash2, FileText, DollarSign, RefreshCw, Hourglass, Calendar as CalendarIcon, Columns3, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getCustomers, deleteCustomer, type Customer } from "@/services/customers";
import { getSales, type Sale } from "@/services/sales";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";


import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompany } from "@/context/company-context";

declare module "jspdf" {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

interface CustomerWithStats extends Customer {
    balance: number;
    isCredit: boolean;
    totalSales: number;
    paidAmount: number;
}


export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState<number>(10);
  
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    name: true,
    email: true,
    phone: true,
    balance: true,
  });

  const currency = companyInfo?.currencySymbol || '$';

  async function fetchPeople() {
    try {
      setLoading(true);
      const [fetchedCustomers, allSales] = await Promise.all([
        getCustomers(),
        getSales()
      ]);
      
      setSales(allSales);

      const customersWithStats = fetchedCustomers.map((c) => {
          const balance = c.currentBalance || c.openingBalance || 0;
          const isCredit = balance < 0;

          return {
              ...c,
              balance: Math.abs(balance),
              isCredit: isCredit,
          } as CustomerWithStats;
      });
      setCustomers(customersWithStats);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
       toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch customer data.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPeople();
  }, []);
  
    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            const registeredDate = new Date(customer.registered);
            const fromDateMatch = fromDate ? registeredDate >= fromDate : true;
            const toDateMatch = toDate ? registeredDate <= toDate : true;
            const searchMatch = !searchTerm ||
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.phone.toLowerCase().includes(searchTerm.toLowerCase());
            
            return fromDateMatch && toDateMatch && searchMatch;
        }).slice(0, entriesToShow);
    }, [customers, fromDate, toDate, searchTerm, entriesToShow]);

    const summary = useMemo(() => {
        const totalSalesAmount = sales.filter(s => s.status !== 'Return').reduce((acc, s) => acc + s.total, 0);
        const totalPaidAmount = sales.filter(s => s.status === 'Fulfilled').reduce((acc, s) => acc + s.total, 0);
        const totalDue = customers.reduce((acc, c) => acc + (c.isCredit ? -c.balance : c.balance), 0);
        return {
            totalCustomers: customers.length,
            totalSalesAmount,
            totalPaidAmount,
            totalDue,
        }
    }, [customers, sales]);
    
    const tableTotals = useMemo(() => {
        return {
            balance: filteredCustomers.reduce((acc, c) => acc + (c.isCredit ? -c.balance : c.balance), 0),
        }
    }, [filteredCustomers]);

    const getTableData = () => filteredCustomers.map(c => ({
        'Customer ID': c.id,
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone,
        'Balance ($)': `${c.balance.toFixed(2)}${c.isCredit ? ' (Credit)' : ''}`,
    }));

    const handleCopy = () => {
        const data = getTableData();
        const tsv = Papa.unparse(data, { delimiter: "\t" });
        navigator.clipboard.writeText(tsv).then(() => {
        toast({ title: "Success", description: "Table data copied to clipboard." });
        }, (err) => {
        toast({ variant: "destructive", title: "Error", description: "Failed to copy data." });
        console.error('Failed to copy: ', err);
        });
    };

    const handleExport = (format: 'csv' | 'excel') => {
        const data = getTableData();
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `customers-export.${format === 'excel' ? 'csv' : format}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Success", description: `Data exported as ${format.toUpperCase()}.` });
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePdfExport = () => {
        const doc = new jsPDF();
        doc.text("Customers List", 14, 16);
        doc.autoTable({
            head: [['Customer ID', 'Name', 'Email', 'Phone', `Balance (${currency})`]],
            body: filteredCustomers.map(c => [
                c.id,
                c.name,
                c.email,
                c.phone,
                `${c.balance.toFixed(2)}${c.isCredit ? ' (Credit)' : ''}`
            ]),
            startY: 20,
        });
        doc.save('customers-list.pdf');
        toast({ title: "Success", description: "Data exported as PDF." });
    }
    
  const handleDeleteCustomer = async (customerId: string) => {
    setIsDeleting(true);
    try {
      await deleteCustomer(customerId);
      toast({
        title: "Success",
        description: "Customer has been deleted successfully.",
      });
      fetchPeople(); // Refresh the list
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete customer. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }
  
  type ColumnKeys = keyof typeof columnVisibility;
  const toggleColumn = (column: ColumnKeys) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  }

  return (
    <div className="flex flex-col gap-4">
        <div>
            <h1 className="text-3xl font-bold">Customer List</h1>
            <p className="text-muted-foreground">View/Search Customers</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-blue-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-12 bg-white/20"/> : summary.totalCustomers}</h3>
                <p>Total Customers</p>
                </div>
                <FileText className="h-12 w-12 opacity-50" />
            </CardContent>
            </Card>
            <Card className="bg-green-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalSalesAmount.toFixed(2)}`}</h3>
                <p>Total Sales Amount</p>
                </div>
                <DollarSign className="h-12 w-12 opacity-50" />
            </CardContent>
            </Card>
            <Card className="bg-orange-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalPaidAmount.toFixed(2)}`}</h3>
                <p>Total Received Amount</p>
                </div>
                <RefreshCw className="h-12 w-12 opacity-50" />
            </CardContent>
            </Card>
            <Card className="bg-red-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalDue.toFixed(2)}`}</h3>
                <p>Total Sales Due</p>
                </div>
                <Hourglass className="h-12 w-12 opacity-50" />
            </CardContent>
            </Card>
        </div>


        <Card>
            <CardHeader>
                 <div className="flex justify-between items-end pb-4">
                     <div className="flex gap-4">
                        <div className="grid gap-2">
                            <label htmlFor="from-date">From Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="to-date">To Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                     </div>
                      <Button asChild>
                        <Link href="/customers/new">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Customer
                        </Link>
                    </Button>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-sm">Show</label>
                         <Select value={String(entriesToShow)} onValueChange={(v) => setEntriesToShow(Number(v))}>
                            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value={String(customers.length)}>All</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm">entries</span>
                     </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>Excel</Button>
                        <Button variant="outline" size="sm" onClick={handlePdfExport}>PDF</Button>
                        <Button variant="outline" size="sm" onClick={handlePrint}>Print</Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>CSV</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                    <Columns3 className="mr-2 h-4 w-4" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.entries(columnVisibility).map(([key, value]) => (
                                    <DropdownMenuCheckboxItem
                                        key={key}
                                        className="capitalize"
                                        checked={value}
                                        onCheckedChange={() => toggleColumn(key as ColumnKeys)}
                                    >
                                        {key.replace(/([A-Z])/g, ' $1')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search..." className="h-9 pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                     </div>
                 </div>

            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-10"><Checkbox /></TableHead>
                    {columnVisibility.id && <TableHead>Customer ID</TableHead>}
                    {columnVisibility.name && <TableHead>Name</TableHead>}
                    {columnVisibility.email && <TableHead>Email</TableHead>}
                    {columnVisibility.phone && <TableHead>Phone</TableHead>}
                    {columnVisibility.balance && <TableHead className="text-right">Balance ({currency})</TableHead>}
                    <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell>
                            <div className="flex justify-center gap-2">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    filteredCustomers.map(customer => (
                        <TableRow key={customer.id}>
                            <TableCell><Checkbox /></TableCell>
                            {columnVisibility.id && <TableCell className="font-mono text-xs">{customer.id}</TableCell>}
                            {columnVisibility.name && <TableCell className="font-medium">{customer.name}</TableCell>}
                            {columnVisibility.email && <TableCell>{customer.email}</TableCell>}
                            {columnVisibility.phone && <TableCell>{customer.phone || 'N/A'}</TableCell>}
                            {columnVisibility.balance && <TableCell className={`text-right font-medium ${customer.isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                {customer.balance.toFixed(2)}
                                {customer.isCredit && <span className="text-green-600"> (Credit)</span>}
                            </TableCell>}
                            <TableCell>
                                <div className="flex justify-center items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/customers/${customer.id}`)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/customers/${customer.id}/edit`)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the customer
                                                and all associated data.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDeleteCustomer(customer.id!)}
                                                className="bg-destructive hover:bg-destructive/90"
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? 'Deleting...' : 'Delete'}
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                    )}
                </TableBody>
                 <TableFooter>
                    <TableRow>
                        <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="font-bold text-right">Total Balance (All Listed Customers):</TableCell>
                        {columnVisibility.balance && <TableCell className="text-right font-bold">
                            {currency}{tableTotals.balance.toFixed(2)}
                        </TableCell>}
                        <TableCell colSpan={2}></TableCell>
                    </TableRow>
                </TableFooter>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

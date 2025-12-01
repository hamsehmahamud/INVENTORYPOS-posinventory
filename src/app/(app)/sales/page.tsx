
"use client";

import {
  MoreHorizontal,
  PlusCircle,
  ShoppingBag,
  RefreshCw,
  Hourglass,
  Calendar as CalendarIcon,
  Search,
  ChevronDown,
  Columns3,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getSales, deleteSale, type Sale } from "@/services/sales";
import { getCustomers, type Customer } from "@/services/customers";
import { getUsers, type User } from "@/services/users";
import Link from "next/link";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/context/company-context";
import { useRouter } from "next/navigation";

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


export default function SalesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState<number>(10);
  
  const [columnVisibility, setColumnVisibility] = useState({
    salesDate: true,
    salesCode: true,
    salesStatus: true,
    referenceNo: true,
    customerName: true,
    total: true,
    paidPayment: true,
    due: true,
    paymentStatus: true,
    createdBy: true,
  });

  const currency = companyInfo?.currencySymbol || '$';

  const fetchData = async () => {
     try {
        setLoading(true);
        const [fetchedSales, fetchedCustomers, fetchedUsers] = await Promise.all([
            getSales(),
            getCustomers(),
            getUsers()
        ]);
        
        const enhancedSales = fetchedSales.map(sale => {
            const isPaid = sale.status === 'Fulfilled';
            const paidPayment = isPaid ? sale.total : 0;
            const due = isPaid ? 0 : sale.total;
            let paymentStatus: 'Paid' | 'Unpaid' = isPaid ? 'Paid' : 'Unpaid';
            
            const creator = fetchedUsers.find(u => u.name === 'Admin User') // Mock creator
            
            return {
                ...sale,
                paidPayment,
                due,
                paymentStatus,
                referenceNo: `REF-${sale.orderId.split('-')[1]}`,
                createdBy: creator?.name || 'Admin', // Mock data
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

  useEffect(() => {
    fetchData();
  }, []);
  
  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        const fromDateMatch = fromDate ? saleDate >= fromDate : true;
        const toDateMatch = toDate ? saleDate <= toDate : true;
        const customerMatch = selectedCustomer === 'all' || sale.customer === customers.find(c => c.id === selectedCustomer)?.name;
        const userMatch = selectedUser === 'all' || sale.createdBy === users.find(u => u.id === selectedUser)?.name;
        const searchMatch = !searchTerm ||
            sale.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return fromDateMatch && toDateMatch && customerMatch && userMatch && searchMatch;
      })
      .slice(0, entriesToShow);
  }, [sales, fromDate, toDate, selectedCustomer, selectedUser, searchTerm, entriesToShow, customers, users]);


  const summary = {
      totalInvoices: filteredSales.length,
      totalInvoiceAmount: filteredSales.reduce((acc, sale) => acc + sale.total, 0),
      totalReceivedAmount: filteredSales.reduce((acc, sale) => acc + sale.paidPayment, 0),
      totalSalesDue: filteredSales.reduce((acc, sale) => acc + sale.due, 0),
  };
  
  const tableTotals = {
      total: filteredSales.reduce((acc, sale) => acc + sale.total, 0),
      paidPayment: filteredSales.reduce((acc, sale) => acc + sale.paidPayment, 0),
      due: filteredSales.reduce((acc, sale) => acc + sale.due, 0),
  }
  
  const handleDeleteSale = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteSale(id);
      toast({ title: "Success", description: "Sale deleted successfully." });
      await fetchData();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete sale.' });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Sales List</h1>
                <p className="text-muted-foreground">View/Search Sold Items</p>
            </div>
            <div className="flex gap-2">
                <Button asChild><Link href="/sales/new"><PlusCircle className="mr-2 h-4 w-4" />New Sale</Link></Button>
                <Button variant="outline" asChild><Link href="/sales/returns">Sales Returns</Link></Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-[#17a2b8] text-white"><CardContent className="p-4 flex items-center justify-between"><div><h3 className="text-3xl font-bold">{summary.totalInvoices}</h3><p>Total Invoices</p></div><ShoppingBag className="h-12 w-12 opacity-50" /></CardContent></Card>
             <Card className="bg-[#28a745] text-white"><CardContent className="p-4 flex items-center justify-between"><div><h3 className="text-3xl font-bold">{currency}{summary.totalInvoiceAmount.toFixed(2)}</h3><p>Total Invoices Amount</p></div><PlusCircle className="h-12 w-12 opacity-50" /></CardContent></Card>
             <Card className="bg-[#ffc107] text-black"><CardContent className="p-4 flex items-center justify-between"><div><h3 className="text-3xl font-bold">{currency}{summary.totalReceivedAmount.toFixed(2)}</h3><p>Total Received Amount</p></div><RefreshCw className="h-12 w-12 opacity-50" /></CardContent></Card>
             <Card className="bg-[#dc3545] text-white"><CardContent className="p-4 flex items-center justify-between"><div><h3 className="text-3xl font-bold">{currency}{summary.totalSalesDue.toFixed(2)}</h3><p>Total Sales Due</p></div><Hourglass className="h-12 w-12 opacity-50" /></CardContent></Card>
        </div>

        <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="grid gap-2"><label className="text-sm font-medium">Customers</label><Select value={selectedCustomer} onValueChange={setSelectedCustomer}><SelectTrigger><SelectValue placeholder="Search Name/Mobile" /></SelectTrigger><SelectContent><SelectItem value="all">-All Customers-</SelectItem>{customers.map(c => <SelectItem key={c.id!} value={c.id!}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><label className="text-sm font-medium">Created by</label><Select value={selectedUser} onValueChange={setSelectedUser}><SelectTrigger><SelectValue placeholder="-All Users-" /></SelectTrigger><SelectContent><SelectItem value="all">-All Users-</SelectItem>{users.map(u => <SelectItem key={u.id!} value={u.id!}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><label htmlFor="from-date">From Date</label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{fromDate ? format(fromDate, "PPP") : <span>mm/dd/yyyy</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent></Popover></div>
                <div className="grid gap-2"><label htmlFor="to-date">To Date</label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{toDate ? format(toDate, "PPP") : <span>mm/dd/yyyy</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus /></PopoverContent></Popover></div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><div className="flex justify-between items-center"><CardTitle>Sales List</CardTitle><Button asChild size="sm"><Link href="/pos"><PlusCircle className="mr-2 h-4 w-4" /> Add Sale</Link></Button></div></CardHeader>
            <CardContent>
                 <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><label className="text-sm">Show</label><Select value={String(entriesToShow)} onValueChange={(v) => setEntriesToShow(Number(v))}><SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value={String(sales.length)}>All</SelectItem></SelectContent></Select><span className="text-sm">entries</span></div><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="h-9 pl-8 w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
                <div className="relative w-full overflow-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>Sale ID</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Total ($)</TableHead><TableHead className="text-right">Paid ($)</TableHead><TableHead className="text-right">Due ($)</TableHead><TableHead>Status</TableHead><TableHead>Created By</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-32" /></TableCell><TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell><TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell><TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell><TableCell><Skeleton className="h-6 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-28" /></TableCell><TableCell><div className="flex justify-center gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                            ))
                            ) : (
                            filteredSales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">{sale.orderId}</TableCell><TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell><TableCell>{sale.customer}</TableCell><TableCell className="text-right">{currency}{sale.total.toFixed(2)}</TableCell><TableCell className="text-right text-green-600">{currency}{sale.paidPayment.toFixed(2)}</TableCell><TableCell className="text-right text-red-600">{currency}{sale.due.toFixed(2)}</TableCell><TableCell><Badge variant="outline" className={cn({'bg-yellow-100 text-yellow-800 border-yellow-300': sale.paymentStatus === 'Partial','bg-green-100 text-green-800 border-green-300': sale.paymentStatus === 'Paid','bg-red-100 text-red-800 border-red-300': sale.paymentStatus === 'Unpaid',})}>{sale.paymentStatus}</Badge></TableCell><TableCell>{sale.createdBy}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/sales/${sale.id}`)}><Eye className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/sales/${sale.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                                            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the sale.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSale(sale.id!)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? 'Deleting...' : 'Delete'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

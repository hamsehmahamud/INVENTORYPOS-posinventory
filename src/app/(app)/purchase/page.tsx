
'use client';

import {
  PlusCircle,
  Printer,
  FileText,
  DollarSign,
  RefreshCcw,
  Hourglass,
  Calendar as CalendarIcon,
  Eye,
  Pencil,
  Trash2,
  Search,
  Columns3
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUsers,
  type User,
} from '@/services/users';
import { getPurchases, deletePurchase, type Purchase, getSuppliers, type Supplier } from '@/services/purchases';
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCompany } from '@/context/company-context';


declare module "jspdf" {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

export default function PurchaseListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [entriesToShow, setEntriesToShow] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const currency = companyInfo?.currencySymbol || '$';

  const fetchData = async () => {
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
            description: 'Failed to load purchase data.',
        });
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const purchaseDate = new Date(purchase.date);
      const fromDateMatch = fromDate ? purchaseDate >= fromDate : true;
      const toDateMatch = toDate ? purchaseDate <= toDate : true;
      const supplierMatch =
        selectedSupplier === 'all' || purchase.supplier === selectedSupplier;
      const userMatch = selectedUser === 'all' || purchase.createdBy === selectedUser;
      const searchMatch = !searchTerm ||
        purchase.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.createdBy.toLowerCase().includes(searchTerm.toLowerCase());

      return fromDateMatch && toDateMatch && supplierMatch && userMatch && searchMatch;
    }).slice(0, entriesToShow);
  }, [purchases, fromDate, toDate, selectedSupplier, selectedUser, searchTerm, entriesToShow]);
  
  const summary = useMemo(() => {
    const totalInvoices = filteredPurchases.length;
    const totalAmount = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalPaid = filteredPurchases.reduce((acc, p) => acc + p.paidAmount, 0);
    const totalDue = filteredPurchases.reduce((acc, p) => acc + p.dueAmount, 0);
    return { totalInvoices, totalAmount, totalPaid, totalDue };
  }, [filteredPurchases]);

   const handleDeletePurchase = async (id: string) => {
    setIsDeleting(true);
    try {
      await deletePurchase(id);
      toast({ title: 'Success', description: 'Purchase deleted successfully.' });
      await fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete purchase.' });
    } finally {
      setIsDeleting(false);
    }
  };
  
   const getTableData = () => filteredPurchases.map(p => ({
    'Purchase ID': p.purchaseId,
    'Date': new Date(p.date).toLocaleDateString(),
    'Supplier': p.supplier,
    'Total Amount': p.totalAmount.toFixed(2),
    'Paid Amount': p.paidAmount.toFixed(2),
    'Due Amount': p.dueAmount.toFixed(2),
    'Order Status': p.orderStatus,
    'Payment Status': p.paymentStatus,
    'Created By': p.createdBy
  }));

  const handleCopy = () => {
    const tableData = getTableData();
    const tsv = Papa.unparse(tableData, { delimiter: "\t" });
    navigator.clipboard.writeText(tsv).then(() => {
      toast({ title: "Success", description: "Table data copied to clipboard." });
    }, (err) => {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy data." });
      console.error('Failed to copy: ', err);
    });
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const tableData = getTableData();
    const csv = Papa.unparse(tableData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `purchases-export.${format === 'excel' ? 'csv' : format}`);
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
    doc.text("Purchases List", 14, 16);
    doc.autoTable({
        head: [['Purchase ID', 'Date', 'Supplier', 'Total', 'Paid', 'Due', 'Order Status', 'Payment Status', 'Created By']],
        body: filteredPurchases.map(p => [
            p.purchaseId,
            new Date(p.date).toLocaleDateString(),
            p.supplier,
            `${currency}${p.totalAmount.toFixed(2)}`,
            `${currency}${p.paidAmount.toFixed(2)}`,
            `${currency}${p.dueAmount.toFixed(2)}`,
            p.orderStatus,
            p.paymentStatus,
            p.createdBy
        ]),
        startY: 20,
    });
    doc.save('purchases-list.pdf');
    toast({ title: "Success", description: "Data exported as PDF." });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase List</h1>
          <p className="text-muted-foreground">View/Search Purchase Orders</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/purchase/new">
              <PlusCircle className="mr-2" /> New Purchase
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-500 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-12 bg-white/20"/> : summary.totalInvoices}</h3>
              <p>Total Invoices</p>
            </div>
            <FileText className="h-12 w-12 opacity-50" />
          </CardContent>
        </Card>
        <Card className="bg-green-500 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalAmount.toFixed(2)}`}</h3>
              <p>Total Invoices Amount</p>
            </div>
            <DollarSign className="h-12 w-12 opacity-50" />
          </CardContent>
        </Card>
        <Card className="bg-orange-500 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalPaid.toFixed(2)}`}</h3>
              <p>Total Paid Amount</p>
            </div>
            <RefreshCcw className="h-12 w-12 opacity-50" />
          </CardContent>
        </Card>
        <Card className="bg-red-500 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalDue.toFixed(2)}`}</h3>
              <p>Total Purchase Due</p>
            </div>
            <Hourglass className="h-12 w-12 opacity-50" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Supplier</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id!} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Created by</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                   {users.map((u) => (
                    <SelectItem key={u.id!} value={u.name}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="from-date">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fromDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, 'PPP') : <span>mm/dd/yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <label htmlFor="to-date">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !toDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, 'PPP') : <span>mm/dd/yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
           <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <label className="text-sm">Show</label>
                    <Select value={String(entriesToShow)} onValueChange={(v) => setEntriesToShow(Number(v))}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm">entries</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>Excel</Button>
                    <Button variant="outline" size="sm" onClick={handlePdfExport}>PDF</Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>Print</Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>CSV</Button>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search..." 
                            className="h-9 pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-16"/></TableCell>
                                <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                                <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                                <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                                <TableCell><Skeleton className="h-6 w-16 rounded-full"/></TableCell>
                                <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-8 w-8"/>
                                        <Skeleton className="h-8 w-8"/>
                                        <Skeleton className="h-8 w-8"/>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        filteredPurchases.map(purchase => (
                             <TableRow key={purchase.id}>
                                <TableCell>{purchase.purchaseId}</TableCell>
                                <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                                <TableCell>{purchase.supplier}</TableCell>
                                <TableCell>{currency}{purchase.totalAmount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn({
                                        'bg-green-100 text-green-800 border-green-300': purchase.orderStatus === 'Received',
                                        'bg-yellow-100 text-yellow-800 border-yellow-300': purchase.orderStatus === 'Pending',
                                    })}>{purchase.orderStatus}</Badge>
                                </TableCell>
                                <TableCell>
                                     <Badge variant="outline" className={cn({
                                        'bg-green-100 text-green-800 border-green-300': purchase.paymentStatus === 'Paid',
                                        'bg-red-100 text-red-800 border-red-300': purchase.paymentStatus === 'Unpaid',
                                    })}>{purchase.paymentStatus}</Badge>
                                </TableCell>
                                <TableCell>{purchase.createdBy}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/purchase/${purchase.id}`)}><Eye className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/purchase/${purchase.id}/edit`)}><Pencil className="h-4 w-4"/></Button>
                                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the purchase.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePurchase(purchase.id!)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? 'Deleting...' : 'Delete'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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

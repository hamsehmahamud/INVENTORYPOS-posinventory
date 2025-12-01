

"use client";

import { Eye, Pencil, PlusCircle, Search, Trash2, Import, Printer, Calendar as CalendarIcon, Building, Hourglass, RefreshCw, DollarSign, Columns3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getSuppliers, type Supplier, deleteSupplier } from "@/services/suppliers";
import { getPurchases, type Purchase } from "@/services/purchases";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompany } from "@/context/company-context";

declare module "jspdf" {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}


interface SupplierWithStats extends Supplier {
    totalPurchase: number;
    paidAmount: number;
    dueAmount: number;
    contactPerson: string; // Mock data
}


export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();

  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [entriesToShow, setEntriesToShow] = useState<number>(10);
  
  const [columnVisibility, setColumnVisibility] = useState({
    supplierId: true,
    name: true,
    contactPerson: true,
    email: true,
    phone: true,
    balance: true,
  });

  const currency = companyInfo?.currencySymbol || '$';

  async function fetchSuppliers() {
      try {
        setLoading(true);
        const [fetchedSuppliers, allPurchases] = await Promise.all([
          getSuppliers(),
          getPurchases()
        ]);
        
        const suppliersWithStats = fetchedSuppliers.map((s, index) => {
            const supplierPurchases = allPurchases.filter(p => p.supplier === s.name);
            
            const totalPurchase = supplierPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
            const paidAmount = supplierPurchases.reduce((acc, p) => acc + p.paidAmount, 0);
            const dueAmount = supplierPurchases.reduce((acc, p) => acc + p.dueAmount, 0);

            return {
                ...s,
                totalPurchase,
                paidAmount,
                dueAmount,
                contactPerson: s.contactPerson || `063445897${index}`, // Mock contact person
            }
        });
        setSuppliers(suppliersWithStats);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      } finally {
        setLoading(false);
      }
    }


  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
     return suppliers.filter(supplier => {
        const fromDateMatch = fromDate ? new Date(supplier.createdDate || 0) >= fromDate : true;
        const toDateMatch = toDate ? new Date(supplier.createdDate || 0) <= toDate : true;
        const searchMatch = !searchTerm ||
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.supplierId.toLowerCase().includes(searchTerm.toLowerCase());
        
        return searchMatch && fromDateMatch && toDateMatch;
    }).slice(0, entriesToShow);
  }, [suppliers, searchTerm, fromDate, toDate, entriesToShow]);

  const summary = useMemo(() => {
    const totalOwedByCompany = suppliers.reduce((acc, s) => acc + s.dueAmount, 0);
    const totalCredit = suppliers.reduce((acc, s) => acc + (s.initialBalance && s.initialBalance < 0 ? Math.abs(s.initialBalance) : 0), 0);
    return {
        totalSuppliers: suppliers.length,
        totalOwedByCompany,
        totalCredit,
        netBalance: totalOwedByCompany - totalCredit,
    }
  }, [suppliers]);
  
  const handleDeleteSupplier = async (id: string) => {
    setIsDeleting(true);
    try {
        await deleteSupplier(id);
        toast({ title: "Success", description: "Supplier deleted successfully." });
        await fetchSuppliers();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: "Failed to delete supplier." });
    } finally {
        setIsDeleting(false);
    }
  }

  const getTableData = () => filteredSuppliers.map(s => ({
    'Supplier ID': s.supplierId,
    'Name': s.name,
    'Contact Person': s.contactPerson,
    'Email': s.email,
    'Phone': s.phone,
    'Balance': `${currency}${s.dueAmount.toFixed(2)} (Debit)`,
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
    link.setAttribute("download", `suppliers-export.${format === 'excel' ? 'csv' : format}`);
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
    doc.text("Suppliers List", 14, 16);
    doc.autoTable({
        head: [['Supplier ID', 'Name', 'Contact Person', 'Email', 'Phone', `Balance (${currency})`]],
        body: filteredSuppliers.map(s => [
            s.supplierId,
            s.name,
            s.contactPerson,
            s.email,
            s.phone,
            `${currency}${s.dueAmount.toFixed(2)} (Debit)`
        ]),
        startY: 20,
    });
    doc.save('suppliers-list.pdf');
    toast({ title: "Success", description: "Data exported as PDF." });
  }

  type ColumnKeys = keyof typeof columnVisibility;
  const toggleColumn = (column: ColumnKeys) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  }


  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold">Supplier List</h1>
                <p className="text-muted-foreground">Manage your list of suppliers.</p>
            </div>
             <div className="flex gap-2">
                <Button asChild>
                    <Link href="/suppliers/new">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Supplier
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                     <Link href="/suppliers/import">
                        <Import className="h-4 w-4 mr-2" />
                        Import Suppliers
                    </Link>
                </Button>
                 <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                </Button>
            </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-blue-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                    <Building className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-10 bg-white/20"/> : summary.totalSuppliers}</div>
                </CardContent>
            </Card>
            <Card className="bg-red-500 text-white">
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Owed by Company</CardTitle>
                    <Hourglass className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalOwedByCompany.toFixed(2)}`}</div>
                </CardContent>
            </Card>
             <Card className="bg-green-500 text-white">
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Credit (Owed by Suppliers)</CardTitle>
                    <RefreshCw className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24 bg-white/20"/> : `${currency}${summary.totalCredit.toFixed(2)}`}</div>
                </CardContent>
            </Card>
             <Card className="bg-red-600 text-white">
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.netBalance.toFixed(2)}`}</div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Filter Suppliers</CardTitle>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                     <div className="grid gap-2">
                        <Label htmlFor="from-date">Created From Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {fromDate ? format(fromDate, "PPP") : <span>mm/dd/yyyy</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="to-date">Created To Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {toDate ? format(toDate, "PPP") : <span>mm/dd/yyyy</span>}
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
                    <div className="flex items-center gap-2">
                        <label className="text-sm">Show</label>
                         <Select value={String(entriesToShow)} onValueChange={(v) => setEntriesToShow(Number(v))}>
                            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value={String(suppliers.length)}>All</SelectItem>
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
                            <Input 
                                id="search-supplier"
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
                <Table>
                <TableHeader>
                    <TableRow>
                    {columnVisibility.supplierId && <TableHead>Supplier ID</TableHead>}
                    {columnVisibility.name && <TableHead>Name</TableHead>}
                    {columnVisibility.contactPerson && <TableHead>Contact Person</TableHead>}
                    {columnVisibility.email && <TableHead>Email</TableHead>}
                    {columnVisibility.phone && <TableHead>Phone</TableHead>}
                    {columnVisibility.balance && <TableHead className="text-right">Balance</TableHead>}
                    <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                        {columnVisibility.supplierId && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                        {columnVisibility.name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                        {columnVisibility.contactPerson && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                        {columnVisibility.email && <TableCell><Skeleton className="h-5 w-40" /></TableCell>}
                        {columnVisibility.phone && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                        {columnVisibility.balance && <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>}
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
                    filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                            {columnVisibility.supplierId && <TableCell className="font-mono text-xs">{supplier.supplierId}</TableCell>}
                            {columnVisibility.name && <TableCell className="font-medium">{supplier.name}</TableCell>}
                            {columnVisibility.contactPerson && <TableCell>{supplier.contactPerson}</TableCell>}
                            {columnVisibility.email && <TableCell>{supplier.email}</TableCell>}
                            {columnVisibility.phone && <TableCell>{supplier.phone || 'N/A'}</TableCell>}
                            {columnVisibility.balance && <TableCell className="text-right font-medium text-red-600">
                                {currency}{supplier.dueAmount.toFixed(2)}
                                <div className="text-xs text-muted-foreground">(Company Debit)</div>
                            </TableCell>}
                            <TableCell>
                                <div className="flex justify-center items-center gap-2">
                                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/suppliers/${supplier.id}`)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}>
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
                                                This action cannot be undone. This will permanently delete the supplier
                                                and all associated data.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDeleteSupplier(supplier.id!)}
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
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

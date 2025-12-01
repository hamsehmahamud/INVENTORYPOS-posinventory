
'use client';

import {
  PlusCircle,
  ShoppingBag,
  Undo2,
  RefreshCw,
  Hourglass,
  Search,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getPurchases,
  type Purchase,
  getSuppliers,
  type Supplier,
} from '@/services/purchases';
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/context/company-context";


declare module "jspdf" {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

interface SalesReturn extends Purchase {
    returnCode: string;
    paidPayment: number;
    due: number;
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
    createdBy: string;
}

export default function SalesReturnsListPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesToShow, setEntriesToShow] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currency = companyInfo?.currencySymbol || '$';


  useEffect(() => {
    async function fetchData() {
        try {
            setLoading(true);
            const allSales = await getPurchases();
            const fetchedReturns = allSales
                .filter(sale => sale.status === 'Cancelled')
                .map((sale, index) => {
                     const paidPayment = sale.totalAmount;
                     const due = 0;
                     let paymentStatus: 'Paid' | 'Unpaid' | 'Partial' = 'Paid';
                    return {
                        ...sale,
                        returnCode: `RT-${sale.purchaseId.split('-')[1] || String(index + 1).padStart(4, '0')}`,
                        paidPayment: paidPayment,
                        due: due,
                        paymentStatus,
                        createdBy: 'Admin'
                    }
                });
            
            setReturns(fetchedReturns as unknown as SalesReturn[]);
        } catch (error) {
            console.error("Failed to fetch sales returns:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load sales returns data.'
            })
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [toast]);
  
    const filteredReturns = useMemo(() => {
        return returns
            .filter(r => {
                const searchMatch = !searchTerm ||
                    r.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.returnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.supplier.toLowerCase().includes(searchTerm.toLowerCase());
                return searchMatch;
            })
            .slice(0, entriesToShow);
    }, [returns, searchTerm, entriesToShow]);

  
  const summary = useMemo(() => ({
      totalInvoices: filteredReturns.length,
      totalInvoicesAmount: filteredReturns.reduce((acc, item) => acc + item.totalAmount, 0),
      totalReturnedAmount: filteredReturns.reduce((acc, item) => acc + item.paidPayment, 0),
      totalSalesReturnDue: filteredReturns.reduce((acc, item) => acc + item.due, 0),
  }), [filteredReturns]);
  
  const tableTotals = useMemo(() => ({
      total: filteredReturns.reduce((acc, item) => acc + item.totalAmount, 0),
      paidPayment: filteredReturns.reduce((acc, item) => acc + item.paidPayment, 0),
      due: filteredReturns.reduce((acc, item) => acc + item.due, 0),
  }), [filteredReturns]);

  const getTableData = () => filteredReturns.map(item => ({
    'Purchase Date': item.date,
    'Purchase Code': item.purchaseId,
    'Return Code': item.returnCode,
    'Purchase Status': item.orderStatus,
    'Supplier Name': item.supplier,
    'Total': item.totalAmount.toFixed(2),
    'Paid Payment': item.paidPayment.toFixed(2),
    'Due': item.due.toFixed(2),
    'Payment Status': item.paymentStatus,
    'Created by': item.createdBy,
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
    link.setAttribute("download", `purchase-returns-export.${format === 'excel' ? 'csv' : format}`);
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
    doc.text("Purchase Returns List", 14, 16);
    doc.autoTable({
        head: [['Purchase Date', 'Purchase Code', 'Return Code', 'Supplier', 'Total', 'Paid', 'Due', 'Payment Status']],
        body: filteredReturns.map(item => [
            item.date,
            item.purchaseId,
            item.returnCode,
            item.supplier,
            `${currency}${item.totalAmount.toFixed(2)}`,
            `${currency}${item.paidPayment.toFixed(2)}`,
            `${currency}${item.due.toFixed(2)}`,
            item.paymentStatus
        ]),
        startY: 20,
    });
    doc.save('purchase-returns-list.pdf');
    toast({ title: "Success", description: "Data exported as PDF." });
  }

  const handleActionClick = (action: string) => {
    toast({
      title: "Action Triggered",
      description: `${action} action is not yet implemented.`,
    });
  }


  return (
      <div className="flex flex-col gap-6 print:gap-0">
        <div className="print:hidden">
            <h1 className="text-2xl font-bold">Purchase Returns List</h1>
            <p className="text-muted-foreground">View/Search Sold Items</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:hidden">
            <Card className="bg-[#17a2b8] text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalInvoices}</div>
                    <Link href="#" className="text-xs text-white/90 hover:underline">More info &rarr;</Link>
                </CardContent>
            </Card>
             <Card className="bg-[#28a745] text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoices Amount</CardTitle>
                    <PlusCircle className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency}{summary.totalInvoicesAmount.toFixed(2)}</div>
                    <Link href="#" className="text-xs text-white/90 hover:underline">More info &rarr;</Link>
                </CardContent>
            </Card>
             <Card className="bg-[#ffc107] text-black">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Returned Amount</CardTitle>
                    <Undo2 className="h-4 w-4 text-black/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency}{summary.totalReturnedAmount.toFixed(2)}</div>
                    <Link href="#" className="text-xs text-black/90 hover:underline">More info &rarr;</Link>
                </CardContent>
            </Card>
             <Card className="bg-[#dc3545] text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Purchase Return Due</CardTitle>
                    <Hourglass className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency}{summary.totalSalesReturnDue.toFixed(2)}</div>
                    <Link href="#" className="text-xs text-white/90 hover:underline">More info &rarr;</Link>
                </CardContent>
            </Card>
        </div>

        <Card className="print:border-none print:shadow-none">
            <CardHeader className="flex items-center justify-between print:hidden">
                <CardTitle className="text-lg">Purchase Returns List</CardTitle>
                <Button asChild>
                    <Link href="/purchase/returns/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4 print:hidden">
                     <div className="flex items-center gap-2">
                        <label className="text-sm">Show</label>
                         <Select value={String(entriesToShow)} onValueChange={(v) => setEntriesToShow(Number(v))}>
                            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                 <SelectItem value={String(returns.length)}>All</SelectItem>
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
                        <Button variant="outline" size="sm" onClick={() => handleActionClick('Columns')}>Columns</Button>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search..." className="h-9 pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                     </div>
                </div>
                <Table>
                <TableHeader className="bg-primary/10">
                    <TableRow>
                    <TableHead className="w-10 print:hidden"><Checkbox /></TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Purchase Code</TableHead>
                    <TableHead>Return Code</TableHead>
                    <TableHead>Purchase Status</TableHead>
                    <TableHead>Reference No.</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid Payment</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Created by</TableHead>
                    <TableHead className="print:hidden">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}>
                        <TableCell className="print:hidden"><Skeleton className="h-5 w-5" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="print:hidden"><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                    ))
                    ) : (
                    filteredReturns.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="print:hidden"><Checkbox/></TableCell>
                            <TableCell>{item.date}</TableCell>
                            <TableCell className="font-medium">{item.purchaseId}</TableCell>
                            <TableCell>{item.returnCode}</TableCell>
                            <TableCell>{item.orderStatus}</TableCell>
                            <TableCell>{item.paymentTerms || 'N/A'}</TableCell>
                            <TableCell>{item.supplier}</TableCell>
                            <TableCell className="text-right">{currency}{item.totalAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{currency}{item.paidPayment.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{currency}{item.due.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                    {item.paymentStatus}
                                </Badge>
                            </TableCell>
                             <TableCell>{item.createdBy}</TableCell>
                            <TableCell className="print:hidden">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="default" size="sm" className="flex gap-1 bg-blue-600 hover:bg-blue-700">
                                        Action <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View</DropdownMenuItem>
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                    )}
                </TableBody>
                 <TableFooter>
                    <TableRow>
                        <TableCell colSpan={7} className="font-bold text-right">Total</TableCell>
                        <TableCell className="text-right font-bold">{currency}{tableTotals.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold">{currency}{tableTotals.paidPayment.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold">{currency}{tableTotals.due.toFixed(2)}</TableCell>
                        <TableCell colSpan={3}></TableCell>
                    </TableRow>
                </TableFooter>
                </Table>
                 <div className="flex justify-between items-center mt-4 print:hidden">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>1-{filteredReturns.length}</strong> of <strong>{returns.length}</strong> entries
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                            <PaginationPrevious href="#" />
                            </PaginationItem>
                            <PaginationItem>
                            <PaginationLink href="#" isActive>1</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                            <PaginationNext href="#" />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                 </div>
            </CardContent>
        </Card>
    </div>
  );
}

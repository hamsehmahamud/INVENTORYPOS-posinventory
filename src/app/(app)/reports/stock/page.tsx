'use client';

import {
  Boxes,
  Archive,
  DollarSign,
  AlertTriangle,
  Search,
  Filter,
  Columns3,
  Printer,
  FileText,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getItems, getBrands, getCategories, type Item, type Brand, type Category } from "@/services/items";
import Image from "next/image";
import Papa from "papaparse";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCompany } from '@/context/company-context';

declare module "jspdf" {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}


export default function StockReportPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [items, setItems] = useState<Item[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [entriesToShow, setEntriesToShow] = useState<number>(10);
  
  const [columnVisibility, setColumnVisibility] = useState({
    sku: true,
    name: true,
    category: true,
    currentStock: true,
    unit: true,
    purchasePrice: true,
    sellingPrice: true,
    stockValue: true,
  });
  
  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [fetchedItems, fetchedBrands, fetchedCategories] = await Promise.all([
            getItems(),
            getBrands(),
            getCategories()
        ]);
        setItems(fetchedItems);
        setBrands(fetchedBrands);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to fetch data:", error);
         toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load item data.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);
  
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const brandMatch = selectedBrand === 'all' || item.brand === selectedBrand;
        const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
        const searchMatch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        return brandMatch && categoryMatch && searchMatch;
      }).slice(0, entriesToShow);
  }, [items, selectedBrand, selectedCategory, searchTerm, entriesToShow]);
  
  const summary = useMemo(() => {
    const totalStockValuePurchase = items.reduce((acc, item) => acc + (item.purchasePrice || 0) * item.quantity, 0);
    const totalStockValueSales = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const lowStockItems = items.filter(item => item.quantity <= item.minQuantity).length;
    const potentialProfit = totalStockValueSales - totalStockValuePurchase;
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

    return {
        totalItems: items.length,
        totalStockValuePurchase,
        totalStockValueSales,
        lowStockItems,
        potentialProfit,
        stockValueBalance: totalStockValueSales - totalStockValuePurchase,
        totalQuantity,
    }
  }, [items]);
  
  const getTableData = () => {
    const data = filteredItems.map(item => ({
      'SKU': item.sku || 'N/A',
      'Item Name': item.name,
      'Category': item.category,
      'Current Stock': item.quantity,
      'Unit': item.unit,
      'Purchase Price ($)': (item.purchasePrice || 0).toFixed(2),
      'Selling Price ($)': item.price.toFixed(2),
      'Stock Value ($)': ((item.purchasePrice || 0) * item.quantity).toFixed(2),
    }));
    const totals = filteredItems.reduce((acc, item) => {
        acc.stock += item.quantity;
        acc.stockValue += (item.purchasePrice || 0) * item.quantity;
        return acc;
    }, { stock: 0, stockValue: 0 });
     data.push({
        'SKU': 'Total',
        'Item Name': '',
        'Category': '',
        'Current Stock': totals.stock,
        'Unit': '',
        'Purchase Price ($)': '',
        'Selling Price ($)': '',
        'Stock Value ($)': totals.stockValue.toFixed(2),
    });
    return data;
  };

  const handleCopy = () => {
    const data = getTableData();
    const tsv = Papa.unparse(data, { delimiter: "\t" });
    navigator.clipboard.writeText(tsv).then(() => {
      toast({ title: "Success", description: "Table data copied to clipboard." });
    }, (err) => {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy data." });
    });
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const data = getTableData();
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `stock-report.${format === 'excel' ? 'csv' : format}`);
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
    const tableData = filteredItems.map(item => [
        item.sku || 'N/A',
        item.name,
        item.category,
        item.quantity,
        item.unit,
        `${currency}${(item.purchasePrice || 0).toFixed(2)}`,
        `${currency}${item.price.toFixed(2)}`,
        `${currency}${((item.purchasePrice || 0) * item.quantity).toFixed(2)}`,
    ]);
    const totalStock = filteredItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalStockValue = filteredItems.reduce((acc, item) => acc + ((item.purchasePrice || 0) * item.quantity), 0);

    doc.text("Stock Report", 14, 16);
    doc.autoTable({
        head: [['SKU', 'Item Name', 'Category', 'Stock', 'Unit', 'Purchase Price', 'Selling Price', 'Stock Value']],
        body: tableData,
        foot: [['Total', '', '', totalStock, '', '', '', `${currency}${totalStockValue.toFixed(2)}`]],
        startY: 20,
        footStyles: { fontStyle: 'bold', fillColor: [230, 230, 230] }
    });
    doc.save('stock-report.pdf');
    toast({ title: "Success", description: "Data exported as PDF." });
  }

  type ColumnKeys = keyof typeof columnVisibility;
  const toggleColumn = (column: ColumnKeys) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Report</h1>
        <p className="text-muted-foreground">View and analyze your current stock levels.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-blue-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-12 bg-white/20"/> : summary.totalItems}</h3>
                <p>Total Items</p>
                </div>
                <Boxes className="h-12 w-12 opacity-50" />
            </CardContent>
            </Card>
            <Card className="bg-green-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalStockValuePurchase.toFixed(2)}`}</h3>
                <p>Stock Value (Purchase)</p>
                </div>
                <Archive className="h-12 w-12 opacity-50" />
            </CardContent>
            </Card>
            <Card className="bg-orange-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-32 bg-white/20"/> : `${currency}${summary.totalStockValueSales.toFixed(2)}`}</h3>
                <p>Stock Value (Sales)</p>
                </div>
                <DollarSign className="h-12 w-12 opacity-50" />
            </CardContent>
            </Card>
            <Card className="bg-red-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                <h3 className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-12 bg-white/20"/> : summary.lowStockItems}</h3>
                <p>Low Stock Items</p>
                </div>
                <AlertTriangle className="h-12 w-12 opacity-50" />
            </CardContent>
            </Card>
        </div>
      
      <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <label className="font-medium">Brand</label>
                      <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                          <SelectTrigger>
                              <SelectValue placeholder="All Brands" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Brands</SelectItem>
                              {brands.map(brand => (
                                  <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-2">
                       <label className="font-medium">Category</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(category => (
                                     <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                  </div>
              </div>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Stock Details</CardTitle>
                <div className="flex items-center gap-2">
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
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Item Name/Code..."
                            className="pl-8 w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columnVisibility.sku && <TableHead>SKU</TableHead>}
                {columnVisibility.name && <TableHead>Item Name</TableHead>}
                {columnVisibility.category && <TableHead>Category</TableHead>}
                {columnVisibility.currentStock && <TableHead>Current Stock</TableHead>}
                {columnVisibility.unit && <TableHead>Unit</TableHead>}
                {columnVisibility.purchasePrice && <TableHead>Purchase Price ({currency})</TableHead>}
                {columnVisibility.sellingPrice && <TableHead>Selling Price ({currency})</TableHead>}
                {columnVisibility.stockValue && <TableHead>Stock Value ({currency})</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    {columnVisibility.sku && <TableCell>{item.sku || 'N/A'}</TableCell>}
                    {columnVisibility.name && <TableCell className="font-medium">{item.name}</TableCell>}
                    {columnVisibility.category && <TableCell>{item.category}</TableCell>}
                    {columnVisibility.currentStock && <TableCell>{item.quantity}</TableCell>}
                    {columnVisibility.unit && <TableCell>{item.unit}</TableCell>}
                    {columnVisibility.purchasePrice && <TableCell>{currency}{(item.purchasePrice || 0).toFixed(2)}</TableCell>}
                    {columnVisibility.sellingPrice && <TableCell>{currency}{item.price.toFixed(2)}</TableCell>}
                    {columnVisibility.stockValue && <TableCell>{currency}{((item.purchasePrice || 0) * item.quantity).toFixed(2)}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell 
                        colSpan={Object.keys(columnVisibility).filter(k => k !== 'stockValue' && k !== 'currentStock').length} 
                        className="text-right font-bold"
                    >
                       Total
                    </TableCell>
                    {columnVisibility.currentStock && <TableCell className='font-bold'>{summary.totalQuantity}</TableCell>}
                    <TableCell colSpan={Object.keys(columnVisibility).filter(k => k === 'unit' || k === 'purchasePrice' || k === 'sellingPrice').length}></TableCell>
                    {columnVisibility.stockValue && <TableCell className="text-right font-bold">
                        {currency}{filteredItems.reduce((acc, item) => acc + ((item.purchasePrice || 0) * item.quantity), 0).toFixed(2)}
                    </TableCell>}
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

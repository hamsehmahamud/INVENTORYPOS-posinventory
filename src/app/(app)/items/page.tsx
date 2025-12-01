
"use client";

import { MoreHorizontal, PlusCircle, List, Boxes, Printer, FileDown, Search, ChevronDown, ShoppingCart, DollarSign, Archive, AlertTriangle, Columns3, Eye, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getItems, getBrands, getCategories, deleteItem, type Item, type Brand, type Category } from "@/services/items";
import Image from "next/image";
import Link from "next/link";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/context/company-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

declare module "jspdf" {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

export default function ItemsListPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [entriesToShow, setEntriesToShow] = useState<number>(10);
  
  const [columnVisibility, setColumnVisibility] = useState({
    image: true,
    itemCode: true,
    itemName: true,
    brand: true,
    category: true,
    unit: true,
    stockQty: true,
    minQty: true,
    purchasePrice: true,
    salesPrice: true,
    tax: true,
    status: true,
  });

  const currency = companyInfo?.currencySymbol || '$';


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

  useEffect(() => {
    fetchData();
  }, [toast]);
  
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const brandMatch = selectedBrand === 'all' || item.brand === selectedBrand;
        const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
        const searchMatch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase());
        return brandMatch && categoryMatch && searchMatch;
      })
      .slice(0, entriesToShow);
  }, [items, selectedBrand, selectedCategory, searchTerm, entriesToShow]);
  
  const summary = useMemo(() => {
    const totalStockValuePurchase = items.reduce((acc, item) => acc + (item.purchasePrice || 0) * item.quantity, 0);
    const totalStockValueSales = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const lowStockItems = items.filter(item => item.quantity <= item.minQuantity).length;

    return {
        totalItems: items.length,
        totalStockValuePurchase,
        totalStockValueSales,
        lowStockItems
    }
  }, [items]);
  
   const getTableData = () => filteredItems.map(item => ({
      'Item Code': item.sku || 'N/A',
      'Item Name': item.name,
      'Image URL': item.image || 'N/A',
      'Brand': item.brand || 'N/A',
      'Category': item.category,
      'Unit': item.unit,
      'Stock Qty.': item.quantity,
      'Minimum Qty.': item.minQuantity,
      'Purchase Price': (item.purchasePrice || 0).toFixed(2),
      'Final Sales Price': item.price.toFixed(2),
      'Tax': item.tax,
      'Status': "Active",
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
    link.setAttribute("download", `items-export.${format === 'excel' ? 'csv' : format}`);
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
    doc.text("Items List", 14, 16);
    doc.autoTable({
        head: [['Item Code', 'Item Name', 'Brand', 'Category', 'Unit', 'Stock Qty.', 'Min. Qty.', 'Purchase Price', 'Sales Price', 'Tax', 'Status']],
        body: filteredItems.map(item => [
            item.sku || 'N/A',
            item.name,
            item.brand || 'N/A',
            item.category,
            item.unit,
            item.quantity.toFixed(2),
            item.minQuantity,
            `${currency}${(item.purchasePrice || 0).toFixed(2)}`,
            `${currency}${item.price.toFixed(2)}`,
            item.tax,
            "Active"
        ]),
        startY: 20,
    });
    doc.save('items-list.pdf');
    toast({ title: "Success", description: "Data exported as PDF." });
  }

  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(true);
    try {
        await deleteItem(itemId);
        toast({ title: "Success", description: "Item deleted successfully." });
        fetchData(); // Refresh list
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item.' });
    } finally {
        setIsDeleting(false);
    }
  }
  
  type ColumnKeys = keyof typeof columnVisibility;
  const toggleColumn = (column: ColumnKeys) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  }



  return (
    <div className="grid gap-6 print:gap-0">
        <div className="flex items-center justify-between print:hidden">
            <div>
                <h1 className="text-2xl font-bold">Items List</h1>
                <p className="text-sm text-muted-foreground">Home / Items List</p>
            </div>
             <Button asChild>
                <Link href="/items/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Item
                </Link>
            </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12"/> : summary.totalItems}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Stock Value (Purchase)</CardTitle>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32"/> : `${currency}${summary.totalStockValuePurchase.toFixed(2)}`}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Stock Value (Sales)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32"/> : `${currency}${summary.totalStockValueSales.toFixed(2)}`}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12"/> : summary.lowStockItems}</div>
                </CardContent>
            </Card>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="print:hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 flex flex-wrap items-center gap-4">
                     <div className="grid gap-2">
                        <label className="text-sm font-medium">Brand</label>
                        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                            <SelectTrigger className="w-full md:w-48">
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
                        <label className="text-sm font-medium">Category</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full md:w-48">
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
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>Excel</Button>
                    <Button variant="outline" size="sm" onClick={handlePdfExport}>PDF</Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>Print</Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>CSV</Button>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or code..." 
                            className="pl-8 w-full md:w-64"
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
                  <TableHead className="w-10 print:hidden"><Checkbox /></TableHead>
                  {columnVisibility.image && <TableHead className="w-[100px]">Image</TableHead>}
                  {columnVisibility.itemCode && <TableHead>Item Code</TableHead>}
                  {columnVisibility.itemName && <TableHead>Item Name</TableHead>}
                  {columnVisibility.brand && <TableHead>Brand</TableHead>}
                  {columnVisibility.category && <TableHead>Category</TableHead>}
                  {columnVisibility.unit && <TableHead>Unit</TableHead>}
                  {columnVisibility.stockQty && <TableHead>Stock Qty.</TableHead>}
                  {columnVisibility.minQty && <TableHead>Minimum Qty.</TableHead>}
                  {columnVisibility.purchasePrice && <TableHead>Purchase Price</TableHead>}
                  {columnVisibility.salesPrice && <TableHead>Final Sales Price</TableHead>}
                  {columnVisibility.tax && <TableHead>Tax</TableHead>}
                  {columnVisibility.status && <TableHead>Status</TableHead>}
                  <TableHead className="print:hidden">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="print:hidden"><Skeleton className="h-5 w-5" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-md" /></TableCell>
                        <TableCell className="print:hidden"><Skeleton className="h-8 w-20 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredItems.map((item, index) => (
                    <TableRow key={`${item.id}-${index}`}>
                        <TableCell className="print:hidden"><Checkbox /></TableCell>
                        {columnVisibility.image && <TableCell>
                            <Image
                                alt={item.name}
                                className="aspect-square rounded-md object-cover"
                                height="40"
                                src={item.image || "https://placehold.co/40x40.png"}
                                width="40"
                                data-ai-hint="product image"
                            />
                        </TableCell>}
                        {columnVisibility.itemCode && <TableCell>{item.sku || 'N/A'}</TableCell>}
                        {columnVisibility.itemName && <TableCell>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">HSN: {item.hsn}</div>
                            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                        </TableCell>}
                        {columnVisibility.brand && <TableCell>{item.brand || 'N/A'}</TableCell>}
                        {columnVisibility.category && <TableCell>{item.category}</TableCell>}
                        {columnVisibility.unit && <TableCell>{item.unit}</TableCell>}
                        {columnVisibility.stockQty && <TableCell>{item.quantity.toFixed(2)}</TableCell>}
                        {columnVisibility.minQty && <TableCell>{item.minQuantity}</TableCell>}
                        {columnVisibility.purchasePrice && <TableCell>{currency}{(item.purchasePrice || 0).toFixed(2)}</TableCell>}
                        {columnVisibility.salesPrice && <TableCell>{currency}{item.price.toFixed(2)}</TableCell>}
                        {columnVisibility.tax && <TableCell>{item.tax}</TableCell>}
                        {columnVisibility.status && <TableCell>
                            <Badge variant={item.quantity > item.minQuantity ? 'default' : item.quantity > 0 ? 'secondary' : 'destructive'} className={cn({
                                'bg-emerald-500/20 text-emerald-500 border-emerald-500/20': item.quantity > item.minQuantity,
                                'bg-amber-500/20 text-amber-500 border-amber-500/20': item.quantity > 0 && item.quantity <= item.minQuantity,
                                'bg-red-500/20 text-red-500 border-red-500/20': item.quantity <= 0,
                            })}>
                                {item.quantity > item.minQuantity ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                            </Badge>
                        </TableCell>}
                        <TableCell className="print:hidden">
                            <div className="flex justify-center items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/items/${item.id}/edit`)}>
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
                                            This action cannot be undone. This will permanently delete the item.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => handleDeleteItem(item.id!)}
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
          <CardFooter className="print:hidden">
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{filteredItems.length}</strong> of <strong>{items.length}</strong> products
            </div>
          </CardFooter>
        </Card>
    </div>
  );
}

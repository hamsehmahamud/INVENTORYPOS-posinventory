

'use client';

import { FileText, DollarSign, Calendar as CalendarIcon, Search, Filter, Columns3 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getItems, type Item } from '@/services/items';
import { getSales, type Sale } from '@/services/sales';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { useCompany } from '@/context/company-context';

interface SaleWithItems extends Sale {
  items: {
      itemId: string;
      name: string;
      quantity: number;
      price: number;
  }[];
}


export default function ItemSalesReportPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [items, setItems] = useState<Item[]>([]);
  const [sales, setSales] = useState<SaleWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Assuming getSales can be modified to return items, or we'll have to cross-reference
        const [fetchedItems, fetchedSales] = await Promise.all([
          getItems(),
          getSales() as Promise<SaleWithItems[]>, // Casting to include items
        ]);
        setItems(fetchedItems);
        setSales(fetchedSales.filter(s => Array.isArray(s.items))); // Ensure sales have items
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load report data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const reportData = useMemo(() => {
    const itemSalesMap = new Map<string, { totalQuantity: number; totalAmount: number; itemDetails: Item }>();

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const fromDateMatch = fromDate ? saleDate >= fromDate : true;
      const toDateMatch = toDate ? saleDate <= toDate : true;

      if (sale.status === 'Fulfilled' && fromDateMatch && toDateMatch) {
        sale.items.forEach(sItem => {
          const itemDetails = items.find(i => i.id === sItem.itemId || i.name === sItem.name);
          if (itemDetails) {
            const existing = itemSalesMap.get(itemDetails.id!) || { totalQuantity: 0, totalAmount: 0, itemDetails: itemDetails };
            existing.totalQuantity += sItem.quantity;
            existing.totalAmount += sItem.price * sItem.quantity;
            itemSalesMap.set(itemDetails.id!, existing);
          }
        });
      }
    });
    
    return Array.from(itemSalesMap.values()).filter(item =>
      item.itemDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemDetails.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, sales, searchTerm, fromDate, toDate]);

  return (
    <div className="flex flex-col gap-6">
      <CardHeader className="p-0">
        <CardTitle>Item Sales Report</CardTitle>
        <CardDescription>Analyze sales data for each item.</CardDescription>
      </CardHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="grid gap-2">
              <label htmlFor="from-date">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !fromDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <label htmlFor="to-date">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !toDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}
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
            <CardTitle>Sales Details</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Item Name/Code..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Sales Quantity</TableHead>
                <TableHead className="text-right">Total Sales Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                reportData.map((data) => (
                  <TableRow key={data.itemDetails.id}>
                    <TableCell className="font-medium">{data.itemDetails.name}</TableCell>
                    <TableCell>{data.itemDetails.sku}</TableCell>
                    <TableCell>{data.itemDetails.category}</TableCell>
                    <TableCell className="text-right">{data.totalQuantity}</TableCell>
                    <TableCell className="text-right">{currency}{data.totalAmount.toFixed(2)}</TableCell>
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


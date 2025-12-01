

'use client';

import { FileText, DollarSign, Calendar as CalendarIcon, Search, Filter, Columns3 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getItems, type Item } from '@/services/items';
import { getPurchases, type Purchase } from '@/services/purchases';
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

export default function ItemPurchaseReportPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [items, setItems] = useState<Item[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [fetchedItems, fetchedPurchases] = await Promise.all([
          getItems(),
          getPurchases()
        ]);
        setItems(fetchedItems);
        setPurchases(fetchedPurchases);
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
    const itemPurchaseMap = new Map<string, { totalQuantity: number; totalAmount: number; itemDetails: Item }>();

    purchases.forEach(purchase => {
      const purchaseDate = new Date(purchase.date);
      const fromDateMatch = fromDate ? purchaseDate >= fromDate : true;
      const toDateMatch = toDate ? purchaseDate <= toDate : true;

      if (fromDateMatch && toDateMatch) {
        purchase.items.forEach(pItem => {
          const dbItem = items.find(i => i.name === pItem.manualName); // Simple name-based matching
          if (dbItem) {
            const existing = itemPurchaseMap.get(dbItem.id!) || { totalQuantity: 0, totalAmount: 0, itemDetails: dbItem };
            existing.totalQuantity += pItem.quantity;
            existing.totalAmount += pItem.total;
            itemPurchaseMap.set(dbItem.id!, existing);
          }
        });
      }
    });

    return Array.from(itemPurchaseMap.values()).filter(item => 
      item.itemDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemDetails.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, purchases, searchTerm, fromDate, toDate]);

  return (
    <div className="flex flex-col gap-6">
      <CardHeader className="p-0">
        <CardTitle>Item Purchase Report</CardTitle>
        <CardDescription>Analyze purchase data for each item.</CardDescription>
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
            <CardTitle>Purchase Details</CardTitle>
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
                <TableHead className="text-right">Total Purchase Quantity</TableHead>
                <TableHead className="text-right">Total Purchase Amount</TableHead>
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

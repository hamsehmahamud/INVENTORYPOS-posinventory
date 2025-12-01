
'use client';

import {
  FileText,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getItems, type Item } from '@/services/items';

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
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function ExpiredItemsReportPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const fetchedItems = await getItems();
        setItems(fetchedItems);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load item data.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const expiredItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    return items
      .filter((item) => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        return expiryDate < today;
      })
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [items, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <CardHeader className="p-0">
        <CardTitle>Expired Items Report</CardTitle>
        <CardDescription>
          A list of all items that have passed their expiration date.
        </CardDescription>
      </CardHeader>
      
       <div className="grid gap-4 md:grid-cols-4">
        <Card className="col-span-1 bg-red-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expired Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12 bg-white/20" /> : expiredItems.length}
            </div>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expired Item Details</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Item Name/SKU..."
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
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Stock Quantity</TableHead>
                <TableHead className="text-right">Expired On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-10 w-10" /><Skeleton className="h-5 w-32" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : expiredItems.length > 0 ? (
                expiredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                         <div className="flex items-center gap-2">
                            <Image
                            alt={item.name}
                            className="aspect-square rounded-md object-cover"
                            height="40"
                            src={item.image || "https://placehold.co/40x40.png"}
                            width="40"
                            data-ai-hint="product image"
                            />
                            <span className="font-medium">{item.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No expired items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

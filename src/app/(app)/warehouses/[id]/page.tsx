
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getWarehouseById, type Warehouse } from '@/services/warehouses';
import { getItems, type Item } from '@/services/items';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Boxes, DollarSign, Search, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompany } from '@/context/company-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function WarehouseDetailsPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);
        const [fetchedWarehouse, allItems] = await Promise.all([
          getWarehouseById(id),
          getItems(),
        ]);

        if (!fetchedWarehouse) {
          toast({ variant: 'destructive', title: 'Error', description: 'Warehouse not found.' });
          router.push('/warehouses');
          return;
        }

        setWarehouse(fetchedWarehouse);
        setItems(allItems.filter(item => item.warehouse === id));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load warehouse data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, toast, router]);

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const summary = useMemo(() => {
    const productCount = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const stockValue = items.reduce((sum, item) => sum + item.quantity * (item.purchasePrice || 0), 0);
    return { productCount, totalQuantity, stockValue };
  }, [items]);
  
  if (loading) {
    return <Skeleton className="h-[600px] w-full" />;
  }
  
  if (!warehouse) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Warehouse: {warehouse.name}
          </h1>
          <p className="text-muted-foreground">{warehouse.address}</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/warehouses`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
            </Button>
             <Button variant="default">
                <Edit className="mr-2 h-4 w-4" />
                Edit Warehouse
            </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.productCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuantity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency}{summary.stockValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items in this Warehouse</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
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
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                         <div className="flex items-center gap-2">
                            <Image
                                alt={item.name}
                                className="aspect-square rounded-md object-cover"
                                height="40"
                                src={item.image || "https://placehold.co/40x40.png"}
                                width="40"
                            />
                            <span className="font-medium">{item.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>{item.sku || 'N/A'}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{currency}{item.purchasePrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{currency}{item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={item.quantity > item.minQuantity ? 'default' : item.quantity > 0 ? 'secondary' : 'destructive'} className={cn({'bg-green-100 text-green-800 border-green-300': item.quantity > item.minQuantity, 'bg-yellow-100 text-yellow-800 border-yellow-300': item.quantity > 0 && item.quantity <= item.minQuantity, 'bg-red-100 text-red-800 border-red-300': item.quantity <= 0})}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No items found in this warehouse.
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

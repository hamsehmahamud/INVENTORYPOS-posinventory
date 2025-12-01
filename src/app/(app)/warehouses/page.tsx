
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getWarehouses, type Warehouse } from '@/services/warehouses';
import { getItems, type Item } from '@/services/items';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Warehouse as WarehouseIcon, Package, Boxes, DollarSign, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompany } from '@/context/company-context';

interface WarehouseWithStats extends Warehouse {
  productCount: number;
  totalQuantity: number;
  stockValue: number;
}

export default function WarehousesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [warehouses, setWarehouses] = useState<WarehouseWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [fetchedWarehouses, allItems] = await Promise.all([
          getWarehouses(),
          getItems(),
        ]);

        const warehousesWithStats = fetchedWarehouses.map(warehouse => {
          const warehouseItems = allItems.filter(item => item.warehouse === warehouse.id);
          const productCount = warehouseItems.length;
          const totalQuantity = warehouseItems.reduce((sum, item) => sum + item.quantity, 0);
          const stockValue = warehouseItems.reduce((sum, item) => sum + item.quantity * (item.purchasePrice || 0), 0);
          return { ...warehouse, productCount, totalQuantity, stockValue };
        });

        setWarehouses(warehousesWithStats);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load warehouses data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warehouses</h1>
          <p className="text-muted-foreground">Manage your inventory storage locations.</p>
        </div>
        <Button asChild>
          <Link href="/warehouses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Warehouse
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map(warehouse => (
            <Card key={warehouse.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <WarehouseIcon className="h-6 w-6 text-primary" />
                            {warehouse.name}
                        </CardTitle>
                        <CardDescription>{warehouse.address || 'No address specified'}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/warehouses/${warehouse.id}`)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Total Products</span>
                  </div>
                  <span className="font-bold text-lg">{warehouse.productCount}</span>
                </div>
                 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-3">
                        <Boxes className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Total Quantity</span>
                    </div>
                    <span className="font-bold text-lg">{warehouse.totalQuantity}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                   <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Total Stock Value</span>
                   </div>
                  <span className="font-bold text-lg">{currency}{warehouse.stockValue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

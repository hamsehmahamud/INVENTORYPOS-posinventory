
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getStockTransfers, type StockTransfer } from '@/services/transfers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, ArrowRightLeft, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StockTransfersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const fetchedTransfers = await getStockTransfers();
        setTransfers(fetchedTransfers);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load stock transfers.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);
  
  const handleViewDetails = (id: string) => {
    // This can be implemented to show a dialog or navigate to a details page
    toast({ title: 'Info', description: `Viewing details for transfer ${id} (Not implemented)`})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Transfers</h1>
          <p className="text-muted-foreground">
            A history of all item movements between warehouses.
          </p>
        </div>
        <Button asChild>
          <Link href="/warehouses/transfers/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Transfer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From Warehouse</TableHead>
                <TableHead>To Warehouse</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                     <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : transfers.length > 0 ? (
                transfers.map(transfer => (
                  <TableRow key={transfer.id}>
                    <TableCell>{new Date(transfer.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transfer.fromWarehouseName}</TableCell>
                    <TableCell>{transfer.toWarehouseName}</TableCell>
                    <TableCell>{transfer.items.length}</TableCell>
                    <TableCell>
                      <Badge variant={transfer.status === 'Completed' ? 'default' : 'secondary'} className={transfer.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-300' : ''}>
                        {transfer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(transfer.id!)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No stock transfers found.
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


'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getWarehouses, type Warehouse } from '@/services/warehouses';
import { getItems, type Item } from '@/services/items';
import { createStockTransfer } from '@/services/transfers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const transferItemSchema = z.object({
  itemId: z.string().min(1, 'Item is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
});

const formSchema = z.object({
  fromWarehouseId: z.string().min(1, 'Source warehouse is required.'),
  toWarehouseId: z.string().min(1, 'Destination warehouse is required.'),
  items: z.array(transferItemSchema).min(1, 'At least one item is required for transfer.'),
  notes: z.string().optional(),
});

export default function NewStockTransferPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{ itemId: '', quantity: 1 }],
      status: 'Completed',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const fromWarehouseId = form.watch('fromWarehouseId');
  const availableItems = useMemo(() => {
    if (!fromWarehouseId) return [];
    return items.filter(item => item.warehouse === fromWarehouseId);
  }, [items, fromWarehouseId]);


  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [fetchedWarehouses, fetchedItems] = await Promise.all([
          getWarehouses(),
          getItems(),
        ]);
        setWarehouses(fetchedWarehouses);
        setItems(fetchedItems);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load initial data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);
  

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    const fromWarehouse = warehouses.find(w => w.id === values.fromWarehouseId);
    const toWarehouse = warehouses.find(w => w.id === values.toWarehouseId);

    if (!fromWarehouse || !toWarehouse) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid warehouse selection.' });
        setIsSaving(false);
        return;
    }

    try {
        await createStockTransfer({
            ...values,
            date: new Date().toISOString(),
            fromWarehouseName: fromWarehouse.name,
            toWarehouseName: toWarehouse.name,
            status: 'Completed',
        });
      toast({ title: 'Success', description: 'Stock transferred successfully.' });
      router.push('/warehouses/transfers');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create stock transfer.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">New Stock Transfer</h1>
          <p className="text-muted-foreground">Move items between warehouses.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/warehouses/transfers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transfers List
          </Link>
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fromWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Warehouse *</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                        <SelectContent>{warehouses.map(w => <SelectItem key={w.id!} value={w.id!}>{w.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="toWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Warehouse *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger></FormControl>
                        <SelectContent>{warehouses.map(w => <SelectItem key={w.id!} value={w.id!}>{w.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Items to Transfer</FormLabel>
                <div className="border rounded-md mt-2">
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-[60%]">Item</TableHead><TableHead>Quantity</TableHead><TableHead></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.itemId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!fromWarehouseId}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger></FormControl>
                                                        <SelectContent>{availableItems.map(item => <SelectItem key={item.id!} value={item.id!}>{item.name} (Available: {item.quantity})</SelectItem>)}</SelectContent>
                                                    </Select>
                                                     <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl><Input type="number" {...field} /></FormControl>
                                                     <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ itemId: '', quantity: 1 })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
                 {form.formState.errors.items && <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.items.message}</p>}
              </div>

               <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add any relevant notes for this transfer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Transfer
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addWarehouse } from '@/services/warehouses';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  address: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});

export default function NewWarehousePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      status: 'Active',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      await addWarehouse(values);
      toast({ title: 'Success', description: 'Warehouse created successfully.' });
      router.push('/warehouses');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create warehouse.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold">Add New Warehouse</h1>
                <p className="text-muted-foreground">Create a new location to store inventory.</p>
            </div>
             <Button variant="outline" asChild>
                <Link href="/warehouses">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to List
                </Link>
            </Button>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>Warehouse Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Warehouse Name *</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Main Warehouse" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                        <Textarea placeholder="123 Storage Way, Industrial Park" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Warehouse
                    </Button>
                </CardFooter>
            </Card>
            </form>
        </Form>
    </div>
  );
}

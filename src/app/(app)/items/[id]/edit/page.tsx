
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from "next/image";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCompany } from "@/context/company-context";
import { getItemById, updateItem, getCategories, getBrands, type Category, type Brand } from '@/services/items';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoading } from '@/context/loading-context';

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  quantity: z.coerce.number().int('Quantity must be a whole number'),
  status: z.string().min(1, 'Status is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  sku: z.string().optional(),
  hsn: z.string().optional(),
  unit: z.string().optional(),
  minQuantity: z.coerce.number().int('Minimum quantity must be a whole number').optional(),
  purchasePrice: z.coerce.number().min(0, 'Purchase price must be a positive number').optional(),
  tax: z.string().optional(),
});


export default function EditItemPage() {
  const { companyInfo } = useCompany();
  const currency = companyInfo?.currencySymbol || '$';
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { toast } = useToast();
  const { setIsLoading } = useLoading();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [itemData, fetchedCategories, fetchedBrands] = await Promise.all([
            getItemById(id),
            getCategories(),
            getBrands(),
        ]);
        
        if (itemData) {
            form.reset({
                ...itemData,
                purchasePrice: itemData.purchasePrice || 0,
                minQuantity: itemData.minQuantity || 0
            });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Item not found.' });
            router.push('/items');
        }

        setCategories(fetchedCategories);
        setBrands(fetchedBrands);

      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load item data.' });
      } finally {
        setLoading(false);
      }
    }
    if (id) {
        fetchData();
    }
  }, [id, form, router, toast]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    setIsLoading(true);
    try {
      await updateItem(id, {
        ...values,
        minQuantity: values.minQuantity || 0,
        purchasePrice: values.purchasePrice || 0,
      });
      toast({ title: 'Success', description: 'Item updated successfully.' });
      router.push('/items');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update item.' });
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  }

  if (loading) {
    return <Card><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Product Details</CardTitle>
                <CardDescription>
                  Update the details for your product.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Product Name *</Label>
                      <FormControl>
                        <Input placeholder="e.g., Classic T-Shirt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Description</Label>
                      <FormControl>
                        <Textarea placeholder="Provide a detailed description of the product." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Image
                    alt="Product image"
                    className="aspect-square w-full rounded-md object-cover"
                    height="300"
                    src={form.watch('image') || "https://placehold.co/300x300.png"}
                    width="300"
                    data-ai-hint="product placeholder"
                  />
                   <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Image URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Price ({currency}) *</Label>
                      <FormControl>
                        <Input type="number" placeholder="99.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Quantity *</Label>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
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
                      <Label>Status *</Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="In Stock">In Stock</SelectItem>
                          <SelectItem value="Low Stock">Low Stock</SelectItem>
                          <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Category *</Label>
                       <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => <SelectItem key={cat.id!} value={cat.name}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Brand</Label>
                       <Select onValueChange={field.onChange} value={field.value || ''} disabled={loading}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands.map(b => <SelectItem key={b.id!} value={b.name}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Discard</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
        </div>
      </form>
    </Form>
  );
}


'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar as CalendarIcon, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/company-context';
import { getSuppliers, type Supplier } from '@/services/suppliers';
import { getSupplierPaymentById, updateSupplierPayment } from '@/services/supplier-payments';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier."),
  date: z.date({ required_error: "Payment date is required." }),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
  paymentMethod: z.string().min(1, "Please select a payment method."),
  notes: z.string().optional(),
});

export default function EditSupplierPaymentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const { companyInfo } = useCompany();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const currency = companyInfo?.currencySymbol || '$';
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const fetchPayment = useCallback(async () => {
    if (!id) return;
    try {
        setLoading(true);
        const [fetchedSuppliers, paymentData] = await Promise.all([
             getSuppliers(),
             getSupplierPaymentById(id)
        ]);
        setSuppliers(fetchedSuppliers);

        if (paymentData) {
            form.reset({
                ...paymentData,
                date: new Date(paymentData.date)
            });
        } else {
             toast({ variant: 'destructive', title: 'Error', description: 'Payment not found.' });
             router.push('/accounting/supplier-payments/list');
        }

    } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch payment details.' });
    } finally {
        setLoading(false);
    }
  }, [id, form, router, toast]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!id) return;
    setIsSaving(true);
    const supplier = suppliers.find(s => s.id === values.supplierId);
    if (!supplier) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected supplier not found.' });
        setIsSaving(false);
        return;
    }

    try {
      await updateSupplierPayment(id, {
        ...values,
        supplierName: supplier.name,
      });
      toast({ title: 'Success', description: 'Payment updated successfully.' });
      router.push('/accounting/supplier-payments/list');
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not update the payment. Please try again.',
      });
    } finally {
        setIsSaving(false);
    }
  }
  
  if (loading) {
    return (
        <Card className="max-w-2xl mx-auto">
             <CardHeader>
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="grid gap-6">
                 <div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                 <div className="grid grid-cols-2 gap-6"><div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div><div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div></div>
                 <div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                 <div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-20 w-full" /></div>
            </CardContent>
            <CardFooter className="flex justify-end"><Skeleton className="h-10 w-24" /></CardFooter>
        </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Edit Supplier Payment</CardTitle>
            <CardDescription>Update the details for the payment made.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                   <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id!} value={s.id!}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount Paid ({currency})</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-1.5">
                            <FormLabel>Payment Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl><Textarea placeholder="e.g., Payment for PO #456" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSaving || loading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

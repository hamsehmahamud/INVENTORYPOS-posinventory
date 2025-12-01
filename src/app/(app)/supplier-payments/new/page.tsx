
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
import { Calendar as CalendarIcon, Save, Loader2, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/company-context';
import { getSuppliers, type Supplier } from '@/services/suppliers';
import { addSupplierPayment } from '@/services/supplier-payments';
import { useRouter } from 'next/navigation';
import Link from "next/link";

const formSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier."),
  date: z.date({ required_error: "Payment date is required." }),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
  paymentMethod: z.string().min(1, "Please select a payment method."),
  notes: z.string().optional(),
});

export default function NewSupplierPaymentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const currency = companyInfo?.currencySymbol || '$';
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      notes: "",
    },
  });

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const fetchedSuppliers = await getSuppliers();
        setSuppliers(fetchedSuppliers);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load suppliers.' });
      } finally {
        setLoading(false);
      }
    }
    fetchSuppliers();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    const supplier = suppliers.find(s => s.id === values.supplierId);
    if (!supplier) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected supplier not found.' });
        setIsSaving(false);
        return;
    }

    try {
      await addSupplierPayment({
        ...values,
        supplierName: supplier.name,
        purchaseId: `PUR-PAY-SUPP-${Date.now()}` 
      });
      toast({ title: 'Success', description: 'Supplier payment recorded successfully.' });
      router.push('/accounting/supplier-payments/list');
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save the payment. Please try again.',
      });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Record Supplier Payment</CardTitle>
            <CardDescription>Fill in the details for the payment made to a supplier.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                   <div className="flex justify-between items-center">
                     <FormLabel>Supplier</FormLabel>
                     <Button variant="link" size="sm" asChild className="p-0 h-auto">
                        <Link href="/suppliers/new"><Building className="mr-2 h-4 w-4" /> New Supplier</Link>
                     </Button>
                   </div>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              Record Payment
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

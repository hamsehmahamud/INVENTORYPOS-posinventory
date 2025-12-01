
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCustomerById, updateCustomer, type Customer } from "@/services/customers";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().min(1, { message: "Phone number is required." }),
});

export default function EditCustomerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const customerData = await getCustomerById(id);
      if (customerData) {
        form.reset(customerData);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Customer not found.' });
        router.push('/customers');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch customer details.' });
    } finally {
      setLoading(false);
    }
  }, [id, form, router, toast]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateCustomer(id, values);
      toast({
        title: "Success",
        description: "Customer details updated successfully.",
      });
      router.push('/customers');
      router.refresh();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update customer. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
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
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="grid gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="grid gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
             <CardFooter className="flex justify-end">
                 <Skeleton className="h-10 w-24" />
             </CardFooter>
        </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Edit Customer</CardTitle>
            <CardDescription>Update the customer's details below.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1 234 567 890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

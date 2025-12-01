

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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addCustomer } from "@/services/customers";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowLeft, Info, Calendar as CalendarIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useCompany } from "@/context/company-context";
import Link from "next/link";
import { useLoading } from "@/context/loading-context";


const formSchema = z.object({
  name: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  phone: z.string().min(1, "Phone number is required."),
  address: z.string().optional(),
  notes: z.string().optional(),
  openingBalance: z.coerce.number().optional(),
  balanceDate: z.date().optional(),
});

export default function NewCustomerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { companyInfo } = useCompany();
  const { setIsLoading } = useLoading();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currency = companyInfo?.currencySymbol || '$';
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      openingBalance: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      await addCustomer({
          ...values,
      });
      toast({
        title: "Success",
        description: "New customer has been added successfully.",
      });
      router.push('/customers');
      router.refresh();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new customer. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Add New Customer</h1>
                <p className="text-muted-foreground">Create a new customer profile.</p>
            </div>
            <Button variant="outline" asChild>
                <Link href="/customers">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Customers List
                </Link>
            </Button>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                        <CardDescription>Fill in the details for the new customer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address (Optional)</FormLabel>
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
                                            <Input type="tel" placeholder="e.g., (555) 123-4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </div>
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Address (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Street Address, City, State, ZIP Code" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>General Notes (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Any specific notes about this customer..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Opening Balance</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                           Optionally set an opening balance (debt) for the customer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="openingBalance"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Opening Balance / Debt ({currency})</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                     <p className="text-xs text-muted-foreground">Amount the customer already owes you. Use a positive number.</p>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                          <FormField
                            control={form.control}
                            name="balanceDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col gap-2">
                                <FormLabel>Balance Date (Optional)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground">The date this opening balance is effective from.</p>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                         </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Customer
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}

    

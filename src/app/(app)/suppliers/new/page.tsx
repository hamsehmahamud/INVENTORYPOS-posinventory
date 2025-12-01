

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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowLeft, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { addSupplier } from "@/services/suppliers";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


const formSchema = z.object({
  name: z.string().min(2, { message: "Supplier name must be at least 2 characters." }),
  contactPerson: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  initialBalance: z.coerce.number().optional(),
  balanceDate: z.date().optional(),
  balanceExplanation: z.string().optional(),
});


export default function NewSupplierPage() {
  const router = useRouter();
  const { companyInfo } = useCompany();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const currency = companyInfo?.currencySymbol || '$';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      initialBalance: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      await addSupplier(values);
      toast({
        title: "Success",
        description: "New supplier has been added successfully.",
      });
      router.push('/suppliers');
      router.refresh(); 
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new supplier. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Add New Supplier</h1>
                    <p className="text-muted-foreground">Create a new supplier profile.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/suppliers">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Suppliers List
                    </Link>
                </Button>
            </div>
        
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Information</CardTitle>
                        <CardDescription>Fill in the details for the new supplier.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="supplier-id">Supplier ID</Label>
                            <Input id="supplier-id" disabled value="Auto-generated on save" />
                            <p className="text-xs text-muted-foreground">The Supplier ID is automatically generated.</p>
                        </div>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <Label>Supplier Name / Company *</Label>
                                <FormControl>
                                    <Input placeholder="e.g., FuelMax Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FormItem>
                                <Label>Contact Person (Optional)</Label>
                                <FormControl>
                                    <Input placeholder="e.g., Sarah Connor" {...field} />
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
                                <Label>Email Address (Optional)</Label>
                                <FormControl>
                                    <Input type="email" placeholder="e.g., sales@fuelmax.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                <Label>Phone Number (Optional)</Label>
                                <FormControl>
                                    <Input type="tel" placeholder="e.g., (555) 001-1234" {...field} />
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
                                <Label>Address (Optional)</Label>
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
                                <Label>General Notes (Optional)</Label>
                                <FormControl>
                                    <Textarea placeholder="Payment terms, account number, etc..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Initial Balance Setup</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Optionally, set a previous balance for this supplier. This will be their starting account balance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="initialBalance"
                                render={({ field }) => (
                                    <FormItem>
                                    <Label>Initial Balance ({currency})</Label>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">Enter a positive value if your company owes the supplier, or a negative value if the supplier owes your company (credit).</p>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="balanceDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col gap-2">
                                    <Label>Balance Date (Optional)</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal",
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
                                     <p className="text-xs text-muted-foreground">The date this initial balance was effective.</p>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <FormField
                            control={form.control}
                            name="balanceExplanation"
                            render={({ field }) => (
                                <FormItem>
                                <Label>Balance Explanation (Optional)</Label>
                                <FormControl>
                                     <Textarea placeholder="Reason for this initial balance (e.g., 'Carry-over from old system', 'Prepayment for goods')" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </CardContent>
                </Card>
            </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Supplier
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

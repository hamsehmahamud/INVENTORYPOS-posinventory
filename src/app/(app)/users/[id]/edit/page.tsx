
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserById, updateUser, getRoles, type User, type Role } from "@/services/users";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.string().min(1, "Role is required."),
  status: z.string().min(1, "Status is required."),
});

export default function EditUserPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const id = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  
  useEffect(() => {
    if (userProfile && userProfile.role !== 'Admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to edit users.',
      });
      router.push('/users');
    }
  }, [userProfile, router, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      status: "Active",
    },
  });

  const fetchUserAndRoles = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [userData, fetchedRoles] = await Promise.all([
        getUserById(id),
        getRoles()
      ]);
      
      setRoles(fetchedRoles);

      if (userData) {
        form.reset(userData);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
        router.push('/users');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user details.' });
    } finally {
      setLoading(false);
    }
  }, [id, form, router, toast]);

  useEffect(() => {
     if (userProfile?.role === 'Admin') {
        fetchUserAndRoles();
    }
  }, [fetchUserAndRoles, userProfile]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateUser(id, {
        name: values.name,
        role: values.role,
        status: values.status as User['status'],
      });
      toast({
        title: "Success",
        description: "User details updated successfully.",
      });
      router.push('/users');
      router.refresh();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || userProfile?.role !== 'Admin') {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="grid gap-6">
                 <div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                 <div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                 <div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                 <div className="grid gap-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
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
            <CardTitle>Edit User</CardTitle>
            <CardDescription>Update the user's details below.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} disabled />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
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

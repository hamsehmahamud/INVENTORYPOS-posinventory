
"use client";

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
import { createUser } from "@/services/users";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/icons";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const createDefaultAdmin = async () => {
      try {
        await createUser({
          firstName: "Admin",
          lastName: "User",
          name: "Admin User",
          email: "admin@example.com",
          password: "123456",
          role: "Admin",
          status: "Active",
        });
        console.log("Default admin user created or already exists.");
      } catch (error: any) {
        // We can ignore the "already in use" error as it means the user is already set up.
        if (!error.message.includes("already in use")) {
          console.error("Failed to create default admin user:", error);
        }
      }
    };
    createDefaultAdmin();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createUser({
        ...values,
        name: `${values.firstName} ${values.lastName}`,
        role: "User", // Default role for new signups
        status: "Active",
      });
      toast({
        title: "Success",
        description: "Account created successfully. Please log in.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Failed to create user:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create user: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
     <div className="space-y-8">
        <div className="flex flex-col items-center gap-4">
            <Logo className="h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold tracking-tighter">
                Create an Account
            </h1>
        </div>
        <Card className="max-w-2xl mx-auto">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Enter your details to create a new account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                        <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
                </Button>
                 <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Sign in
                    </Link>
                </div>
            </CardFooter>
            </form>
        </Form>
        </Card>
     </div>
  );
}

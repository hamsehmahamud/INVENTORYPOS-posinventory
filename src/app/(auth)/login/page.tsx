
"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Lock, User, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";


export default function LoginPage() {
    const router = useRouter();
    const { user, login } = useAuth();
    const { companyInfo, loading: infoLoading } = useCompany();

    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("123456");
    const [role, setRole] = useState("Admin");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);
    
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password, role);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || "Failed to sign in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    }


  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4">
        {infoLoading ? <Skeleton className="h-12 w-12 rounded-full" /> : companyInfo?.logo ? <Image src={companyInfo.logo} alt="Company Logo" width={64} height={64} className="rounded-md" /> : <Logo className="h-12 w-12 text-primary" />}
        {infoLoading ? (
            <Skeleton className="h-9 w-80" />
        ) : (
            <h1 className="text-3xl font-bold tracking-tighter">
            {companyInfo?.name || "Ultimate Inventory with POS"}
            </h1>
        )}
      </div>

      <Card>
        <form onSubmit={handleSignIn}>
            <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in to start your session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Login Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="admin@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                        </Button>
                    </div>
                     <div className="relative">
                       <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="pl-10">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                                <SelectItem value="Purchase Manager">Purchase Manager</SelectItem>
                                <SelectItem value="User">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                    <Checkbox id="remember-me" />
                    <Label htmlFor="remember-me" className="text-sm font-normal">
                        Remember Me
                    </Label>
                    </div>
                    <Link
                    href="#"
                    className="text-sm text-primary hover:underline"
                    prefetch={false}
                    >
                    I forgot my password
                    </Link>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                </Button>
                <div className="text-center text-xs text-muted-foreground">
                    {infoLoading ? <Skeleton className="h-4 w-16 mx-auto" /> : `Version ${companyInfo?.version || '1.0'}`}
                </div>
            </CardContent>
        </form>
      </Card>
      
    </div>
  );
}

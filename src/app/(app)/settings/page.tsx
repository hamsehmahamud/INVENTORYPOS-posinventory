
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from '@/context/company-context';
import { useToast } from '@/hooks/use-toast';
import { updateCompanyInfo, type CompanyInfo, getCurrencies, type Currency } from '@/services/settings';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { companyInfo, loading: companyLoading, refreshCompanyInfo } = useCompany();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [currency, setCurrency] = useState('');
  const [invoiceTheme, setInvoiceTheme] = useState('modern');

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingTax, setIsSavingTax] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  
  useEffect(() => {
    async function fetchInitialData() {
        if (companyInfo) {
            setName(companyInfo.name || '');
            setEmail(companyInfo.email || '');
            setAddress(companyInfo.address || '');
            setTaxRate(companyInfo.defaultTaxRate || 0);
            setCurrency(companyInfo.currency || '');
            setInvoiceTheme(companyInfo.invoiceSettings?.invoiceTheme || 'modern');
        }
        try {
            setLoadingCurrencies(true);
            const fetchedCurrencies = await getCurrencies();
            setCurrencies(fetchedCurrencies);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load currencies.' });
        } finally {
            setLoadingCurrencies(false);
        }
    }
    fetchInitialData();
  }, [companyInfo, toast]);

  const handleSaveDetails = async () => {
    if (!companyInfo?.id) return;
    setIsSavingDetails(true);
    try {
      const updatedInfo: Partial<CompanyInfo> = {
        name,
        email,
        address
      };
      await updateCompanyInfo({ id: companyInfo.id, ...updatedInfo });
      await refreshCompanyInfo();
      toast({ title: "Success", description: "Store details updated successfully." });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update store details.' });
    } finally {
        setIsSavingDetails(false);
    }
  }

  const handleSaveTaxAndCurrency = async () => {
    if (!companyInfo?.id) return;
    setIsSavingTax(true);
    const selectedCurrency = currencies.find(c => c.id === currency);
    try {
         const updatedInfo: Partial<CompanyInfo> = {
            defaultTaxRate: taxRate,
            currency: currency,
            currencySymbol: selectedCurrency?.symbol
        };
        await updateCompanyInfo({ id: companyInfo.id, ...updatedInfo });
        await refreshCompanyInfo();
        toast({ title: "Success", description: "Tax & Currency settings updated." });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update tax & currency settings.' });
    } finally {
        setIsSavingTax(false);
    }
  }

  const handleSaveInvoiceFormat = async () => {
      if (!companyInfo?.id) return;
      setIsSavingInvoice(true);
      try {
           const updatedInfo: Partial<CompanyInfo> = {
              invoiceSettings: {
                ...companyInfo.invoiceSettings,
                invoiceTheme: invoiceTheme,
              }
          };
          await updateCompanyInfo({ id: companyInfo.id, ...updatedInfo });
          await refreshCompanyInfo();
          toast({ title: "Success", description: "Invoice format updated." });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update invoice format.' });
      } finally {
          setIsSavingInvoice(false);
      }
  }

  const isLoading = companyLoading || loadingCurrencies;

  if (isLoading) {
    return (
        <div className="grid gap-6 max-w-4xl mx-auto">
            <div className="grid gap-2">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-4 w-2/3" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-20" /></CardFooter></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-4 w-2/3" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-20" /></CardFooter></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-4 w-2/3" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-20" /></CardFooter></Card>
            </div>
        </div>
    )
  }

  return (
    <div className="grid gap-6 max-w-4xl mx-auto">
        <div className="grid gap-2">
             <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your store settings and preferences.</p>
        </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
            <CardDescription>
              Update your store's information.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="store-email">Contact Email</Label>
              <Input id="store-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
             <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="store-address">Address</Label>
              <Textarea id="store-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSaveDetails} disabled={isSavingDetails}>
                {isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
            </Button>
          </CardFooter>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Tax & Currency</CardTitle>
                <CardDescription>
                    Configure tax rates and currency options.
                </CardDescription>
            </CardHeader>
             <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                    <Input id="tax-rate" type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                             {currencies.map(c => (
                                <SelectItem key={c.id!} value={c.id!}>{c.name} ({c.symbol})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSaveTaxAndCurrency} disabled={isSavingTax}>
                     {isSavingTax && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </CardFooter>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Invoice Format</CardTitle>
                <CardDescription>
                    Choose the format for your generated invoices.
                </CardDescription>
            </CardHeader>
             <CardContent className="grid gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="invoice-format">Format Template</Label>
                    <Select value={invoiceTheme} onValueChange={setInvoiceTheme}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="compact">Compact</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSaveInvoiceFormat} disabled={isSavingInvoice}>
                     {isSavingInvoice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

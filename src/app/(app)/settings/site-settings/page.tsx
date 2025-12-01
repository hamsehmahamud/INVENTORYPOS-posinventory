
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload } from 'lucide-react';
import { getCompanyInfo, updateCompanyInfo, type CompanyInfo, getCurrencies, type Currency } from '@/services/settings';
import { getCountries, getStates, type Country, type State } from '@/services/places';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useCompany } from '@/context/company-context';


export default function SiteSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { refreshCompanyInfo } = useCompany();
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanyInfo>>({});
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [upiFile, setUpiFile] = useState<File | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const upiInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    async function fetchInfo() {
      try {
        const [info, fetchedCurrencies, fetchedCountries, fetchedStates] = await Promise.all([
          getCompanyInfo(),
          getCurrencies(),
          getCountries(),
          getStates(),
        ]);
        setCompanyInfo(info);
        setCurrencies(fetchedCurrencies);
        setCountries(fetchedCountries);
        setStates(fetchedStates);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load company information.' });
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileSetter: React.Dispatch<React.SetStateAction<File | null>>, fieldName: keyof CompanyInfo) => {
    const file = e.target.files?.[0];
    if (file) {
      fileSetter(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyInfo(prev => ({ ...prev, [fieldName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof CompanyInfo, value: string) => {
    if (id === 'currency') {
      const selectedCurrency = currencies.find(c => c.id === value);
      setCompanyInfo(prev => ({
        ...prev,
        currency: selectedCurrency?.id,
        currencySymbol: selectedCurrency?.symbol
      }));
    } else {
      setCompanyInfo(prev => ({ ...prev, [id]: value }));
    }
  }

  const handleCheckboxChange = (id: keyof CompanyInfo, checked: boolean) => {
     setCompanyInfo(prev => ({ ...prev, [id]: checked }));
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      let infoToSave = { ...companyInfo };

      // Helper for uploading files
      const uploadFile = async (file: File | null, path: string): Promise<string | undefined> => {
        if (!file) return undefined;
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      };
      
      const [logoUrl, signatureUrl, upiUrl] = await Promise.all([
        uploadFile(logoFile, `company/${companyInfo.id}_logo`),
        uploadFile(signatureFile, `company/${companyInfo.id}_signature`),
        uploadFile(upiFile, `company/${companyInfo.id}_upi`),
      ]);

      if (logoUrl) infoToSave.logo = logoUrl;
      if (signatureUrl) infoToSave.signature = signatureUrl;
      if (upiUrl) infoToSave.upiCode = upiUrl;

      await updateCompanyInfo(infoToSave as CompanyInfo);
      await refreshCompanyInfo();
      toast({ title: 'Success', description: 'Company profile updated successfully.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update company profile.' });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name*</Label>
              <Input id="name" value={companyInfo.name || ''} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile">Mobile*</Label>
              <Input id="mobile" value={companyInfo.mobile || ''} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email*</Label>
              <Input id="email" type="email" value={companyInfo.email || ''} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={companyInfo.phone || ''} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input id="gstNumber" value={companyInfo.gstNumber || ''} onChange={handleChange} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input id="vatNumber" value={companyInfo.vatNumber || ''} onChange={handleChange} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input id="panNumber" value={companyInfo.panNumber || ''} onChange={handleChange} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={companyInfo.website || ''} onChange={handleChange} />
            </div>
             <div className="flex items-center space-x-2 mt-4">
                <Checkbox id="showSignature" checked={companyInfo.showSignature || false} onCheckedChange={(checked) => handleCheckboxChange('showSignature', Boolean(checked))} />
                <Label htmlFor="show-signature">Show Signature on Invoice</Label>
                <Badge variant="secondary">Only available to Indian Invoicing Format</Badge>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="signature-file">Signature</Label>
                <Input id="signature-file" type="file" ref={signatureInputRef} className="text-sm" onChange={(e) => handleFileChange(e, setSignatureFile, 'signature')} />
                <p className="text-xs text-muted-foreground">Max Width/Height: 1000px & Size: 1024kb</p>
                <div className="border rounded-md p-4 mt-2 h-40 flex items-center justify-center bg-muted/20">
                    {companyInfo.signature ? (
                        <Image src={companyInfo.signature} alt="Signature Preview" width={200} height={100} className="object-contain max-h-full" />
                    ) : (
                         <div className="text-center text-muted-foreground">
                            <Upload className="mx-auto h-8 w-8" />
                            <p>No Image Available</p>
                        </div>
                    )}
                </div>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="footer">Footer</Label>
              <Textarea id="footer" rows={3} value={companyInfo.footer || ''} onChange={handleChange} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="upiId">UPI Id</Label>
              <Input id="upiId" value={companyInfo.upiId || ''} onChange={handleChange} />
                 <Badge variant="secondary">Only available to Indian Invoicing Format</Badge>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="upi-code-file">UPI Code</Label>
                <Input id="upi-code-file" ref={upiInputRef} type="file" className="text-sm" onChange={(e) => handleFileChange(e, setUpiFile, 'upiCode')} />
                 <p className="text-xs text-muted-foreground">Max Width/Height: 1000px & Size: 1024kb</p>
                 <div className="border rounded-md p-2 mt-2 h-24 flex items-center justify-center bg-muted/20">
                    {companyInfo.upiCode ? (
                        <Image src={companyInfo.upiCode} alt="UPI QR Code Preview" width={80} height={80} className="object-contain" />
                    ) : (
                        <p className="text-muted-foreground text-sm">No Image</p>
                    )}
                </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="currency">Default Currency</Label>
               <Select value={companyInfo.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                       <SelectItem key={c.id!} value={c.id!}>{c.name} ({c.symbol})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bankDetails">Bank Details</Label>
              <Textarea id="bankDetails" rows={3} value={companyInfo.bankDetails || ''} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
               <Select value={companyInfo.country} onValueChange={(value) => handleSelectChange('country', value)}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country"/>
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Select value={companyInfo.state} onValueChange={(value) => handleSelectChange('state', value)}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">City*</Label>
              <Input id="city" value={companyInfo.city || ''} onChange={handleChange} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" value={companyInfo.postcode || ''} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address*</Label>
              <Textarea id="address" rows={3} value={companyInfo.address || ''} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="logo-file">Company Logo</Label>
                <Input id="logo-file" ref={logoInputRef} type="file" className="text-sm" onChange={(e) => handleFileChange(e, setLogoFile, 'logo')} />
                <p className="text-xs text-muted-foreground">Max Width/Height: 1000px & Size: 1024kb</p>
                <div className="border rounded-md p-4 mt-2 h-48 flex items-center justify-center bg-muted/20">
                    {companyInfo.logo ? (
                        <Image src={companyInfo.logo} alt="Company Logo Preview" width={250} height={150} className="object-contain max-h-full" data-ai-hint="company logo"/>
                    ) : (
                         <div className="text-center text-muted-foreground">
                            <Upload className="mx-auto h-8 w-8" />
                            <p>No Image Available</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-6">
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button variant="destructive" className="bg-orange-500 hover:bg-orange-600" onClick={() => router.back()}>Close</Button>
      </CardFooter>
    </Card>
  );
}

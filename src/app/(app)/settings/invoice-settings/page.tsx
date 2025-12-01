
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Printer, RefreshCw, Loader2 } from 'lucide-react';
import { useCompany } from '@/context/company-context';
import { useToast } from '@/hooks/use-toast';
import type { CompanyInfo, InvoiceSettings } from '@/lib/types';
import { updateCompanyInfo } from '@/services/settings';

const defaultSettings: InvoiceSettings = {
    printerType: 'regular',
    invoiceTheme: 'normal',
    paperSize: 'a4',
    fontFamily: 'nunito',
    fontSize: '12px',
    themeColor: '#000000',
    showCompanyInfo: true,
    showCompanyLogo: true,
    companyFontSize: '16px',
    showGstin: false,
    showShippingAddress: false,
    showNote: true,
    showTerms: true,
    showPaidBalance: true,
    showBalance: true,
    itemLabel: 'Item',
    qtyLabel: 'Qty',
    rateLabel: 'Rate',
    discountLabel: 'Discount',
    taxLabel: 'Tax',
    amountLabel: 'Amount',
    headerFontSize: '14px',
    dataFontSize: '12px',
    showDescription: true,
    showDiscount: false,
    showFreeItem: false,
    showUnit: true,
    showTax: false,
    showBatch: false,
};


// Mock data for the live preview
const mockInvoiceData = {
  invoiceNo: 'INV-2024-001',
  date: '20 Aug 2025',
  dueDate: '4 Sep 2025',
  customer: {
    name: 'Sunlight Traders',
    address: 'Address: New Road, Pokhara',
  },
  items: [
    { id: 1, name: 'Laptop', description: 'Dell Inspiron 15', qty: 2, unit: 'Pcs', rate: 100.00, amount: 240.00 },
    { id: 2, name: 'Printer', description: 'HP LaserJet Pro', qty: 1, unit: 'Pcs', rate: 100.00, amount: 100.00 },
  ],
  subtotal: 340.00,
  grandTotal: 367.25,
  paidAmount: 0.00,
  balanceDue: 367.25,
  notes: 'Thank you for your business!',
  terms: 'Payment due within 30 days',
};

const InvoicePreview = ({ settings, companyInfo }: { settings: InvoiceSettings, companyInfo: CompanyInfo | null }) => {
    const mockCompany = companyInfo || { name: 'Amir General Trading', address: 'Your Company Address' };

    const previewStyle = useMemo(() => ({
        fontFamily: settings.fontFamily === 'nunito' ? 'Nunito, sans-serif' : 'Arial, sans-serif',
        fontSize: settings.fontSize,
        color: settings.themeColor
    }), [settings.fontFamily, settings.fontSize, settings.themeColor]);

    return (
        <div id="invoice-preview" className="w-full bg-white p-6 shadow-lg text-black" style={previewStyle}>
            <header className="flex justify-between items-start mb-10">
                <div>
                    {settings.showCompanyInfo && (
                        <div style={{ fontSize: settings.companyFontSize }}>
                            <p className="font-bold text-2xl">{mockCompany.name}</p>
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="font-bold text-xl" style={{ color: settings.themeColor }}>INVOICE</p>
                    <p className="text-xs">Invoice No: {mockInvoiceData.invoiceNo}</p>
                    <p className="text-xs">Date: {mockInvoiceData.date}</p>
                    <p className="text-xs">Due Date: {mockInvoiceData.dueDate}</p>
                </div>
            </header>

            <div className="mb-8">
                <p className="font-bold text-sm">Bill To:</p>
                <p>{mockInvoiceData.customer.name}</p>
                <p className="text-xs">{mockInvoiceData.customer.address}</p>
            </div>

            <table className="w-full text-left text-sm">
                <thead className="border-b">
                    <tr style={{ fontSize: settings.headerFontSize, color: settings.themeColor }}>
                        <th className="py-2 font-bold">{settings.itemLabel}</th>
                        {settings.showDescription && <th className="font-bold">Description</th>}
                        <th className="font-bold text-center">{settings.qtyLabel}</th>
                        {settings.showUnit && <th className="font-bold">Unit</th>}
                        <th className="font-bold text-right">{settings.rateLabel}</th>
                        {settings.showDiscount && <th className="font-bold text-right">{settings.discountLabel}</th>}
                        <th className="font-bold text-right">{settings.amountLabel}</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: settings.dataFontSize }}>
                    {mockInvoiceData.items.map(item => (
                        <tr key={item.id} className="border-b">
                            <td className="py-2">{item.name}</td>
                            {settings.showDescription && <td>{item.description}</td>}
                            <td className="text-center">{item.qty}</td>
                            {settings.showUnit && <td>{item.unit}</td>}
                            <td className="text-right">{item.rate.toFixed(2)}</td>
                            {settings.showDiscount && <td className="text-right">0.00</td>}
                            <td className="text-right">{item.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between mt-8">
                 {settings.showNote && <div className="text-xs">
                    <p className="font-bold">Notes:</p>
                    <p>{mockInvoiceData.notes}</p>
                 </div>}

                <div className="w-1/3 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{mockInvoiceData.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base"><span>Grand Total:</span><span>{mockInvoiceData.grandTotal.toFixed(2)}</span></div>
                    {settings.showPaidBalance && <div className="flex justify-between"><span>Paid Amount:</span><span>{mockInvoiceData.paidAmount.toFixed(2)}</span></div>}
                    {settings.showBalance && <div className="flex justify-between font-bold"><span>Balance Due:</span><span>{mockInvoiceData.balanceDue.toFixed(2)}</span></div>}
                </div>
            </div>
             {settings.showTerms && <div className="text-right text-xs mt-4"><p className="font-bold">Terms:</p><p>{mockInvoiceData.terms}</p></div>}
        </div>
    );
};


export default function InvoiceSettingsPage() {
  const { companyInfo, refreshCompanyInfo } = useCompany();
  const { toast } = useToast();
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (companyInfo?.invoiceSettings) {
        setSettings(companyInfo.invoiceSettings);
    }
  }, [companyInfo]);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async () => {
    if (!companyInfo) return;
    setIsSaving(true);
    try {
        const updatedInfo: Partial<CompanyInfo> = {
            id: companyInfo.id,
            invoiceSettings: settings
        };
        await updateCompanyInfo(updatedInfo as CompanyInfo);
        await refreshCompanyInfo();
        toast({ title: 'Success', description: 'Invoice settings saved successfully.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast({ title: 'Resetted', description: 'Settings have been reset to their default values.' });
  }

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-preview');
    if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Preview</title>');
            printWindow.document.write('<style>body { margin: 0; padding: 0; font-family: Arial, sans-serif; } @page { size: auto; margin: 0; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Configuration */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme Settings</CardTitle>
            <CardDescription>Configure the look and feel of your invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Printer Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">PRINTER SETTINGS</h4>
              <div className="grid gap-2">
                <Label>Printer Type</Label>
                <Select value={settings.printerType} onValueChange={(v) => handleSettingChange('printerType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="regular">Regular Printer</SelectItem><SelectItem value="thermal">Thermal Printer</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Invoice Theme</Label>
                <Select value={settings.invoiceTheme} onValueChange={(v) => handleSettingChange('invoiceTheme', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal Format</SelectItem><SelectItem value="classic">Classic Format</SelectItem></SelectContent>
                </Select>
              </div>
               <div className="grid gap-2">
                <Label>Paper Size</Label>
                <Select value={settings.paperSize} onValueChange={(v) => handleSettingChange('paperSize', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="a4">A4 (210 x 297 mm)</SelectItem><SelectItem value="letter">Letter (8.5 x 11 in)</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />

            {/* Style Settings */}
             <div className="space-y-4">
                <h4 className="font-semibold text-sm">STYLE SETTINGS</h4>
                 <div className="grid gap-2">
                    <Label>Font Family</Label>
                    <Select value={settings.fontFamily} onValueChange={(v) => handleSettingChange('fontFamily', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="nunito">Nunito (Modern)</SelectItem><SelectItem value="arial">Arial (Classic)</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label>Font Size</Label>
                        <Input value={settings.fontSize} onChange={(e) => handleSettingChange('fontSize', e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label>Theme Color</Label>
                        <Input type="color" value={settings.themeColor} onChange={(e) => handleSettingChange('themeColor', e.target.value)} className="p-1"/>
                    </div>
                </div>
            </div>

            <Separator />
            
            {/* Business Details */}
             <div className="space-y-4">
                <h4 className="font-semibold text-sm">BUSINESS DETAILS</h4>
                <div className="flex items-center justify-between"><Label>Show Company Information</Label><Switch checked={settings.showCompanyInfo} onCheckedChange={(c) => handleSettingChange('showCompanyInfo', c)} /></div>
                <div className="flex items-center justify-between"><Label>Show Company Logo</Label><Switch checked={settings.showCompanyLogo} onCheckedChange={(c) => handleSettingChange('showCompanyLogo', c)} /></div>
                <div className="grid gap-2"><Label>Company Font Size</Label><Input value={settings.companyFontSize} onChange={(e) => handleSettingChange('companyFontSize', e.target.value)} /></div>
                <div className="flex items-center justify-between"><Label>Show GSTIN</Label><Switch checked={settings.showGstin} onCheckedChange={(c) => handleSettingChange('showGstin', c)} /></div>
                <div className="flex items-center justify-between"><Label>Show Shipping Address</Label><Switch checked={settings.showShippingAddress} onCheckedChange={(c) => handleSettingChange('showShippingAddress', c)} /></div>
                <div className="flex items-center justify-between"><Label>Show Note</Label><Switch checked={settings.showNote} onCheckedChange={(c) => handleSettingChange('showNote', c)} /></div>
                <div className="flex items-center justify-between"><Label>Show Terms & Condition</Label><Switch checked={settings.showTerms} onCheckedChange={(c) => handleSettingChange('showTerms', c)} /></div>
                <div className="flex items-center justify-between"><Label>Receive & paid balance</Label><Switch checked={settings.showPaidBalance} onCheckedChange={(c) => handleSettingChange('showPaidBalance', c)} /></div>
                <div className="flex items-center justify-between"><Label>Show Balance</Label><Switch checked={settings.showBalance} onCheckedChange={(c) => handleSettingChange('showBalance', c)} /></div>
            </div>

            <Separator />

             {/* Item Table Settings */}
            <div className="space-y-4">
                <h4 className="font-semibold text-sm">ITEM TABLE SETTINGS</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Item</Label><Input value={settings.itemLabel} onChange={(e) => handleSettingChange('itemLabel', e.target.value)} /></div>
                    <div className="grid gap-2"><Label>Qty</Label><Input value={settings.qtyLabel} onChange={(e) => handleSettingChange('qtyLabel', e.target.value)} /></div>
                    <div className="grid gap-2"><Label>Rate</Label><Input value={settings.rateLabel} onChange={(e) => handleSettingChange('rateLabel', e.target.value)} /></div>
                    <div className="grid gap-2"><Label>Discount</Label><Input value={settings.discountLabel} onChange={(e) => handleSettingChange('discountLabel', e.target.value)} /></div>
                    <div className="grid gap-2"><Label>Tax</Label><Input value={settings.taxLabel} onChange={(e) => handleSettingChange('taxLabel', e.target.value)} /></div>
                    <div className="grid gap-2"><Label>Amount</Label><Input value={settings.amountLabel} onChange={(e) => handleSettingChange('amountLabel', e.target.value)} /></div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Header Font</Label><Input value={settings.headerFontSize} onChange={(e) => handleSettingChange('headerFontSize', e.target.value)} /></div>
                    <div className="grid gap-2"><Label>Data Font</Label><Input value={settings.dataFontSize} onChange={(e) => handleSettingChange('dataFontSize', e.target.value)} /></div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2"><Switch id="show-desc" checked={settings.showDescription} onCheckedChange={(c) => handleSettingChange('showDescription', c)} /><Label htmlFor="show-desc">Show Description</Label></div>
                        <div className="flex items-center gap-2"><Switch id="show-disc" checked={settings.showDiscount} onCheckedChange={(c) => handleSettingChange('showDiscount', c)} /><Label htmlFor="show-disc">Show Discount</Label></div>
                        <div className="flex items-center gap-2"><Switch id="show-free" checked={settings.showFreeItem} onCheckedChange={(c) => handleSettingChange('showFreeItem', c)} /><Label htmlFor="show-free">Show Free Item</Label></div>
                    </div>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2"><Switch id="show-unit" checked={settings.showUnit} onCheckedChange={(c) => handleSettingChange('showUnit', c)} /><Label htmlFor="show-unit">Show Unit</Label></div>
                        <div className="flex items-center gap-2"><Switch id="show-tax" checked={settings.showTax} onCheckedChange={(c) => handleSettingChange('showTax', c)} /><Label htmlFor="show-tax">Show Tax</Label></div>
                        <div className="flex items-center gap-2"><Switch id="show-batch" checked={settings.showBatch} onCheckedChange={(c) => handleSettingChange('showBatch', c)} /><Label htmlFor="show-batch">Show Batch</Label></div>
                    </div>
                </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Preview */}
      <div className="lg:col-span-2">
        <Card className="sticky top-6">
            <CardHeader className="flex flex-row justify-between items-center">
                 <CardTitle>Live Preview</CardTitle>
                 <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                    <Button variant="outline" onClick={handleReset}><RefreshCw className="mr-2 h-4 w-4" /> Reset Defaults</Button>
                    <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Preview</Button>
                 </div>
            </CardHeader>
          <CardContent className="bg-muted/30 p-8" >
             <InvoicePreview settings={settings} companyInfo={companyInfo} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

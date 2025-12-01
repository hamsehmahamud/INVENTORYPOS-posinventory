
'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSaleById, type SaleWithItems } from '@/services/sales';
import { useCompany } from '@/context/company-context';
import type { InvoiceSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Printer, ArrowLeft, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';


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


function InvoiceContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { companyInfo } = useCompany();
  const [sale, setSale] = useState<SaleWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settings = companyInfo?.invoiceSettings || defaultSettings;
  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      if (!id) { setError('No sale ID provided.'); setLoading(false); return; }
      try {
        setLoading(true);
        setError(null);
        const foundSale = await getSaleById(id);
        if (foundSale) {
          setSale(foundSale);
        } else {
          setError('Sale not found.');
        }
      } catch (err) {
        setError('Failed to load sale details.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handlePrint = () => {
     const printContent = document.getElementById('invoice-print-area')?.innerHTML;
     if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Invoice</title><style>
                body { font-family: ${settings.fontFamily}, sans-serif; font-size: ${settings.fontSize}; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
            </style></head><body>`);
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
     }
  };

  const summary = useMemo(() => {
    if (!sale) return null;
    const subtotal = sale.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalDiscount = sale.discount || 0;
    const otherCharges = sale.otherCharges || 0;
    const total = subtotal + otherCharges - totalDiscount;
    const paidAmount = sale.status === 'Fulfilled' ? total : 0; 
    const balance = total - paidAmount;
    return { subtotal, totalDiscount, otherCharges, total, paidAmount, balance };
  }, [sale]);

  if (loading) return <Card><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  if (!sale || !summary) return null;
  
   const invoiceStyle = {
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/>Back to List</Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
          <Button variant="outline" onClick={() => router.push(`/sales/${id}/edit`)}><Edit className="mr-2 h-4 w-4"/>Edit</Button>
        </div>
      </div>
      <Card className="print:shadow-none print:border-none" style={invoiceStyle} id="invoice-print-area">
        <CardHeader>
          <div className="flex justify-between items-start">
             <div>
                {settings.showCompanyInfo && companyInfo && (
                    <div style={{ fontSize: settings.companyFontSize }}>
                       {settings.showCompanyLogo && companyInfo.logo && <Image src={companyInfo.logo} alt="Company Logo" width={100} height={100} className="mb-2" />}
                       <p className="font-bold" style={{ color: settings.themeColor }}>{companyInfo.name}</p>
                       <p className="text-xs">{companyInfo.address}</p>
                    </div>
                )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{color: settings.themeColor}}>INVOICE</div>
              <CardDescription>#{sale.orderId}</CardDescription>
              <div className="text-muted-foreground mt-1">Status: <Badge>{sale.status}</Badge></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div><h3 className="font-semibold mb-2">Bill To:</h3><p className="font-bold text-lg">{sale.customer}</p></div>
            <div className="text-right"><p><span className="font-semibold">Invoice Date:</span> {new Date(sale.date).toLocaleDateString()}</p></div>
          </div>
          <Table>
            <TableHeader><TableRow style={{fontSize: settings.headerFontSize, color: settings.themeColor}}><TableHead>{settings.itemLabel}</TableHead>{settings.showUnit && <TableHead>Unit</TableHead>}<TableHead className="text-center">{settings.qtyLabel}</TableHead><TableHead className="text-right">{settings.rateLabel}</TableHead><TableHead className="text-right">{settings.amountLabel}</TableHead></TableRow></TableHeader>
            <TableBody style={{fontSize: settings.dataFontSize}}>{sale.items.map((item, i) => (<TableRow key={i}><TableCell>{item.name}</TableCell>{settings.showUnit && <TableCell>Pcs</TableCell>}<TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-right">{currency}{item.price.toFixed(2)}</TableCell><TableCell className="text-right">{currency}{(item.price * item.quantity).toFixed(2)}</TableCell></TableRow>))}</TableBody>
          </Table>
          <Separator className="my-6" />
          <div className="grid grid-cols-2">
            <div>{settings.showNote && <p className="text-sm"><span className="font-semibold">Notes:</span> Thank you for your business!</p>}</div>
            <div className="space-y-2 text-right text-sm">
              <div className="flex justify-between"><span>Subtotal:</span> <span>{currency}{summary.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Other Charges:</span> <span>{currency}{summary.otherCharges.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount:</span> <span className="text-red-500">-{currency}{summary.totalDiscount.toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Grand Total:</span> <span>{currency}{summary.total.toFixed(2)}</span></div>
              {settings.showPaidBalance && <div className="flex justify-between"><span>Amount Paid:</span> <span>{currency}{summary.paidAmount.toFixed(2)}</span></div>}
              <Separator />
              {settings.showBalance && <div className="flex justify-between font-bold text-lg text-destructive"><span>Balance Due:</span> <span>{currency}{summary.balance.toFixed(2)}</span></div>}
            </div>
          </div>
        </CardContent>
         {settings.showTerms && <CardFooter className="text-center text-xs text-muted-foreground pt-6 border-t"><p>Terms & Conditions: Payment due within 30 days.</p></CardFooter>}
      </Card>
    </div>
  );
}

export default function SaleDetailsPage() {
    return (
        <Suspense fallback={<Card><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>}>
            <InvoiceContent />
        </Suspense>
    )
}

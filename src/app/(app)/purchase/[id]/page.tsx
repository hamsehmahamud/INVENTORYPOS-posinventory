
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPurchaseById, type Purchase } from '@/services/purchases';
import { getSupplierById, type Supplier } from '@/services/suppliers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Printer, FileText, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCompany } from '@/context/company-context';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


interface PurchaseWithSupplier extends Purchase {
  supplierDetails?: Supplier;
}

export default function PurchaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { companyInfo } = useCompany();
  const [purchase, setPurchase] = useState<PurchaseWithSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError('No purchase ID provided.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        
        const foundPurchase = await getPurchaseById(id);
        
        if (foundPurchase) {
          let purchaseWithDetails: PurchaseWithSupplier = foundPurchase;
          if (foundPurchase.supplierId) {
            const supplier = await getSupplierById(foundPurchase.supplierId);
            purchaseWithDetails.supplierDetails = supplier;
          }
          setPurchase(purchaseWithDetails);
        } else {
          setError('Purchase not found.');
        }
      } catch (err) {
        console.error("Failed to fetch purchase data:", err);
        setError('Failed to load purchase details.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handlePdfExport = () => {
    if (!purchase || !companyInfo) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text(companyInfo.name || 'Company Name', 14, 22);
    doc.setFontSize(10);
    doc.text(companyInfo.address || '', 14, 30);
    doc.text(`Email: ${companyInfo.email || ''}`, 14, 35);
    doc.text(`Phone: ${companyInfo.phone || ''}`, 14, 40);
    
    doc.setFontSize(18);
    doc.text(`Purchase Order #${purchase.purchaseId}`, 14, 55);

    // Supplier and Dates
    doc.setFontSize(12);
    doc.text('Supplier:', 14, 65);
    doc.setFontSize(10);
    doc.text(purchase.supplierDetails?.name || purchase.supplier, 14, 70);
    doc.text(purchase.supplierDetails?.address || '', 14, 75);
    doc.text(purchase.supplierDetails?.email || '', 14, 80);
    
    doc.text(`Date: ${new Date(purchase.date).toLocaleDateString()}`, 140, 65);
    doc.text(`Status: ${purchase.orderStatus}`, 140, 70);


    // Items Table
    doc.autoTable({
        startY: 90,
        head: [['Item', 'Quantity', 'Unit Cost', 'Total']],
        body: purchase.items.map(item => [
            item.manualName,
            item.quantity,
            `${currency}${item.unitCost.toFixed(2)}`,
            `${currency}${item.total.toFixed(2)}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${currency}${summary?.subtotal.toFixed(2)}`, 140, finalY + 10);
    doc.text(`Tax: ${currency}${(purchase.taxAmount || 0).toFixed(2)}`, 140, finalY + 15);
    doc.text(`Shipping: ${currency}${(purchase.shippingCost || 0).toFixed(2)}`, 140, finalY + 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${currency}${summary?.total.toFixed(2)}`, 140, finalY + 30);

    doc.save(`PO-${purchase.purchaseId}.pdf`);
};

  const summary = useMemo(() => {
    if (!purchase) return null;
    const subtotal = purchase.items.reduce((acc, item) => acc + item.total, 0);
    const total = subtotal + (purchase.taxAmount || 0) + (purchase.shippingCost || 0);
    const balance = total - purchase.paidAmount;
    return { subtotal, total, balance };
  }, [purchase]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!purchase || !summary) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to List
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4"/>
            Print
          </Button>
          <Button variant="outline" onClick={handlePdfExport}>
            <FileText className="mr-2 h-4 w-4"/>
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Purchase Order</CardTitle>
              <CardDescription>#{purchase.purchaseId}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">INVOICE</div>
              <div className="text-muted-foreground">
                Status: <Badge variant={purchase.orderStatus === 'Received' ? 'default' : 'secondary'}>{purchase.orderStatus}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Supplier:</h3>
              <p className="font-bold text-lg">{purchase.supplierDetails?.name || purchase.supplier}</p>
              <p className="text-muted-foreground">{purchase.supplierDetails?.address}</p>
              <p className="text-muted-foreground">{purchase.supplierDetails?.email}</p>
              <p className="text-muted-foreground">{purchase.supplierDetails?.phone}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Purchase Date:</span> {new Date(purchase.date).toLocaleDateString()}</p>
              <p><span className="font-semibold">Payment Terms:</span> {purchase.paymentTerms}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.manualName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{currency}{item.unitCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{currency}{item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-6" />

          <div className="grid grid-cols-2">
            <div>
              <p className="font-semibold">Notes:</p>
              <p className="text-muted-foreground">{purchase.notes || 'No notes provided.'}</p>
            </div>
            <div className="space-y-2 text-right">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span> <span>{currency}{summary.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax:</span> <span>{currency}{(purchase.taxAmount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping:</span> <span>{currency}{(purchase.shippingCost || 0).toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span >Total:</span> <span>{currency}{summary.total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid:</span> <span>{currency}{purchase.paidAmount.toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg text-destructive"><span >Balance Due:</span> <span>{currency}{summary.balance.toFixed(2)}</span></div>
            </div>
          </div>

        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>Thank you for your business!</p>
        </CardFooter>
      </Card>
    </div>
  );
}

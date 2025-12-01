
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/company-context';
import { getSuppliers, type Supplier } from '@/services/suppliers';
import { getPurchases, type Purchase } from '@/services/purchases';
import { getSupplierPayments, type SupplierPayment } from '@/services/supplier-payments';
import { CalendarIcon, Building, RefreshCw, Printer, FileText, Image as ImageIcon, Receipt } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Progress } from '@/components/ui/progress';

interface Transaction {
  id: string;
  date: string;
  type: 'Purchase' | 'Payment' | 'Return' | 'Opening Balance';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const LoadingSplash = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
            clearInterval(timer);
            return 100;
            }
            return prev + Math.floor(Math.random() * 5) + 1;
        });
        }, 80);
        return () => clearInterval(timer);
    }, []);

    return (
         <Card>
            <CardContent className="p-8 text-center flex flex-col items-center justify-center h-96">
                <h3 className="text-2xl font-semibold mb-4">Generating Report...</h3>
                <p className="text-muted-foreground mb-6">Please wait while we fetch and process the data.</p>
                <Progress value={progress} className="w-2/3" />
                <p className="mt-4 text-sm font-semibold">{Math.round(progress)}%</p>
            </CardContent>
        </Card>
    )
}

const ReportContent = ({ reportData, companyInfo, currency, dateRange }: { reportData: { supplier: Supplier, transactions: Transaction[] }, companyInfo: any, currency: string, dateRange: DateRange | undefined }) => {
    return (
        <div id="report-content" className="bg-background text-foreground p-6 rounded-lg">
            <header className="text-center mb-6">
                {companyInfo && (
                    <>
                        <h1 className="text-3xl font-bold">{companyInfo.name || 'NCS BILLING BOOK'}</h1>
                        <p className="text-sm">{companyInfo.address || '63 Wanbrough Mansions'}</p>
                        <p className="text-sm">Phone: {companyInfo.phone || '+263712303070'}</p>
                        <p className="text-sm">Email: {companyInfo.email || 'sales@bbsupplies.co.zw'}</p>
                    </>
                )}
            </header>
            <div className="border-y-2 border-red-500 py-2 my-4">
                 <h2 className="text-center text-xl font-bold text-red-500">SUPPLIER STATEMENT</h2>
            </div>
            <div className="text-center mb-4">
                <p className="font-bold">Supplier: {reportData.supplier.name}</p>
                <p className="text-sm text-muted-foreground">
                    Period: {dateRange?.from ? format(dateRange.from, 'dd MMM, yyyy') : 'Start'} - {dateRange?.to ? format(dateRange.to, 'dd MMM, yyyy') : 'End'}
                </p>
            </div>
            
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>DATE</TableHead>
                        <TableHead>TYPE</TableHead>
                        <TableHead>REFERENCE</TableHead>
                        <TableHead>DESCRIPTION</TableHead>
                        <TableHead className="text-right">DEBIT</TableHead>
                        <TableHead className="text-right">CREDIT</TableHead>
                        <TableHead className="text-right">BALANCE</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.transactions.map(t => (
                        <TableRow key={t.id}>
                            <TableCell>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                            <TableCell>{t.type}</TableCell>
                            <TableCell>{t.reference}</TableCell>
                            <TableCell>{t.description}</TableCell>
                            <TableCell className="text-right font-semibold text-red-500">{t.debit > 0 ? `${currency}${t.debit.toFixed(2)}` : ''}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">{t.credit > 0 ? `${currency}${t.credit.toFixed(2)}` : ''}</TableCell>
                            <TableCell className="text-right font-bold">{`${currency}${t.balance.toFixed(2)}`}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <footer className="text-center text-xs text-muted-foreground mt-8">
                <p>Generated on: {format(new Date(), 'dd/MM/yyyy, hh:mm:ss a')}</p>
                <p>This is a computer generated report</p>
            </footer>
        </div>
    )
}


export default function SupplierStatementReportPage() {
    const { toast } = useToast();
    const { companyInfo } = useCompany();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    
    const [reportData, setReportData] = useState<{ supplier: Supplier, transactions: Transaction[] } | null>(null);
    const [printFormat, setPrintFormat] = useState<'a4' | 'format-80mm'>('a4');

    const currency = companyInfo?.currencySymbol || '$';

    useEffect(() => {
        async function fetchSuppliers() {
            try {
                const fetchedSuppliers = await getSuppliers();
                setSuppliers(fetchedSuppliers);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load suppliers.' });
            } finally {
                setLoading(false);
            }
        }
        fetchSuppliers();
    }, [toast]);

    const handleGenerateReport = async () => {
        if (!selectedSupplierId) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select a supplier.' });
            return;
        }
        setGenerating(true);
        setReportData(null);
        
        try {
             const [supplierData, allPurchases, allPayments] = await Promise.all([
                suppliers.find(c => c.id === selectedSupplierId),
                getPurchases(),
                getSupplierPayments()
            ]);

            if (supplierData) {
                const supplierPurchases = allPurchases.filter(p => p.supplierId === supplierData.id);
                const supplierPayments = allPayments.filter(p => p.supplierId === supplierData.id);

                const openingBalance = supplierData.initialBalance || 0;
                
                const purchaseTransactions: Transaction[] = supplierPurchases.map(purchase => ({
                    id: `purchase-${purchase.id}`,
                    date: purchase.date,
                    type: purchase.orderStatus === 'Cancelled' ? 'Return' : 'Purchase',
                    reference: purchase.purchaseId,
                    description: `Purchase - ${purchase.purchaseId}`,
                    debit: purchase.orderStatus !== 'Cancelled' ? purchase.totalAmount : 0,
                    credit: purchase.orderStatus === 'Cancelled' ? purchase.totalAmount : 0,
                    balance: 0,
                }));
                
                const paymentTransactions: Transaction[] = supplierPayments.map(payment => ({
                    id: `payment-${payment.id}`,
                    date: payment.date,
                    type: 'Payment',
                    reference: payment.paymentId,
                    description: `Payment - ${payment.paymentId}`,
                    debit: 0,
                    credit: payment.amount,
                    balance: 0,
                }));
                
                let combined = [
                    ...purchaseTransactions,
                    ...paymentTransactions
                ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                if (supplierData.balanceDate) {
                  combined.unshift({
                      id: 'opening', date: supplierData.balanceDate, type: 'Opening Balance', reference: 'N/A', description: 'Opening Balance', debit: openingBalance >= 0 ? openingBalance : 0, credit: openingBalance < 0 ? -openingBalance : 0, balance: 0 
                  });
                }
                
                let filteredTransactions = dateRange?.from && dateRange?.to
                    ? combined.filter(t => isWithinInterval(new Date(t.date), { start: dateRange.from!, end: dateRange.to! }))
                    : combined;
                
                let balance = 0;
                const transactionsWithBalance = filteredTransactions.map(t => {
                    balance += t.debit - t.credit;
                    return { ...t, balance };
                });

                setReportData({
                    supplier: supplierData,
                    transactions: transactionsWithBalance
                });

            } else {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not find selected supplier data.' });
            }
        } catch (error) {
            console.error("Failed to generate report:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate supplier statement.' });
        } finally {
            setGenerating(false);
        }
    };
    
    const handlePrint = (format: 'a4' | 'format-80mm') => {
        const reportElement = document.getElementById('report-content-container');
        if (reportElement) {
            document.body.classList.add(`${format}-print-format`);
            window.print();
            document.body.classList.remove(`${format}-print-format`);
        }
    };
    
    const handlePdfExport = () => {
        if (!reportData || !companyInfo) return;
        const doc = new jsPDF();
        const { supplier, transactions } = reportData;

        // Header
        doc.setFontSize(18);
        doc.text(companyInfo.name || 'NCS BILLING BOOK', 105, 22, { align: 'center'});
        doc.setFontSize(10);
        doc.text(companyInfo.address || '63 Wanbrough Mansions', 105, 30, { align: 'center'});
        doc.text(`Phone: ${companyInfo.phone || '+263712303070'}`, 105, 35, { align: 'center'});
        doc.text(`Email: ${companyInfo.email || 'sales@bbsupplies.co.zw'}`, 105, 40, { align: 'center'});
        
        doc.setDrawColor(220, 53, 69); // red
        doc.setLineWidth(1.5);
        doc.rect(14, 48, 182, 10);
        doc.setFontSize(14);
        doc.setTextColor(220, 53, 69);
        doc.text('SUPPLIER STATEMENT', 105, 55, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Supplier: ${supplier.name}`, 105, 68, { align: 'center' });
        doc.setFontSize(10);
        const period = `Period: ${dateRange?.from ? format(dateRange.from, 'dd MMM, yyyy') : 'Start'} - ${dateRange?.to ? format(dateRange.to, 'dd MMM, yyyy') : 'End'}`
        doc.text(period, 105, 74, { align: 'center' });

        doc.autoTable({
            startY: 85,
            head: [['DATE', 'TYPE', 'REFERENCE', 'DESCRIPTION', 'DEBIT', 'CREDIT', 'BALANCE']],
            body: transactions.map(t => [
                new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                t.type,
                t.reference,
                t.description,
                 { content: t.debit > 0 ? `${currency}${t.debit.toFixed(2)}` : '', styles: { halign: 'right', textColor: [220, 53, 69] } },
                { content: t.credit > 0 ? `${currency}${t.credit.toFixed(2)}` : '', styles: { halign: 'right', textColor: [25, 135, 84] } },
                { content: `${currency}${t.balance.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } },
            ]),
            theme: 'plain',
            styles: { fontSize: 9 },
            headStyles: { fillColor: false, textColor: 100, fontStyle: 'bold' },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy, hh:mm:ss a')}`, 105, finalY, { align: 'center' });
        doc.text(`This is a computer generated report`, 105, finalY + 4, { align: 'center' });


        doc.save(`statement-supplier-${supplier.name.replace(/\s/g, '_')}.pdf`);
    };

    const handleImageExport = () => {
        const reportElement = document.getElementById('report-content');
        if (reportElement) {
            html2canvas(reportElement, { scale: 2 }).then((canvas) => {
                const image = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = image;
                link.download = `supplier-statement-${reportData?.supplier.name}.png`;
                link.click();
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Statement Report</CardTitle>
                        <CardDescription>Select filters to generate a supplier statement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="grid gap-2">
                                <Label>Select Supplier</Label>
                                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={loading}>
                                    <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => <SelectItem key={s.id!} value={s.id!}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Date Range</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal",!dateRange && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Button onClick={handleGenerateReport} disabled={generating}>
                                <RefreshCw className={cn("mr-2 h-4 w-4", generating && "animate-spin")} />
                                Generate Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {generating ? (
                 <LoadingSplash />
            ) : reportData ? (
                 <div id="report-content-container">
                    <div className="flex flex-wrap gap-2 my-4 print:hidden">
                        <Button size="sm" onClick={() => handlePrint('a4')} className="bg-blue-600 hover:bg-blue-700 text-white"><Printer className="mr-2 h-4 w-4" />Print</Button>
                        <Button size="sm" onClick={handlePdfExport} className="bg-green-600 hover:bg-green-700 text-white"><FileText className="mr-2 h-4 w-4"/>Export PDF</Button>
                        <Button size="sm" onClick={handleImageExport} className="bg-orange-500 hover:bg-orange-600 text-white"><ImageIcon className="mr-2 h-4 w-4"/>Export Image</Button>
                        <Button size="sm" onClick={() => handlePrint('a4')} className="bg-cyan-600 hover:bg-cyan-700 text-white"><FileText className="mr-2 h-4 w-4"/>A4 Format</Button>
                        <Button size="sm" onClick={() => handlePrint('format-80mm')} className="bg-red-500 hover:bg-red-600 text-white"><Receipt className="mr-2 h-4 w-4"/>80MM Receipt</Button>
                    </div>
                    <ReportContent reportData={reportData} companyInfo={companyInfo} currency={currency} dateRange={dateRange} />
                </div>
            ) : (
                 <div className="print:hidden">
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <Building className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-lg font-semibold">Generate a Statement</h3>
                            <p>Select a supplier and date range to view their transaction history.</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

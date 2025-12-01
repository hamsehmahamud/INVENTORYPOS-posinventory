
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSaleById, type SaleWithItems } from '@/services/sales';
import { getCustomerById, type Customer } from '@/services/customers';
import { useCompany } from '@/context/company-context';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface SaleWithPayments extends SaleWithItems {
    payments: {
        type: string;
        amount: number;
        note?: string;
        date: any; // Can be Timestamp or string
    }[];
}

function InvoiceContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [sale, setSale] = useState<SaleWithPayments | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const { companyInfo, loading: companyLoading } = useCompany();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!orderId) {
                setLoading(false);
                return;
            };
            
            try {
                const fetchedSale = await getSaleById(orderId);
                setSale(fetchedSale as SaleWithPayments);

                if (fetchedSale && fetchedSale.customerId && fetchedSale.customerId !== 'walkin') {
                    const fetchedCustomer = await getCustomerById(fetchedSale.customerId);
                    setCustomer(fetchedCustomer);
                }
            } catch (error) {
                console.error("Failed to fetch invoice data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [orderId]);
    
     useEffect(() => {
        if (!loading && !companyLoading && sale) {
            setTimeout(() => window.print(), 500);
        }
    }, [loading, companyLoading, sale]);

    if (loading || companyLoading) {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white">
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-6" />
                <hr className="my-6" />
                <Skeleton className="h-32 w-full mb-6" />
                <hr className="my-6" />
                <Skeleton className="h-24 w-1/2 ml-auto" />
            </div>
        )
    }

    if (!sale || !companyInfo) {
        return <div className="text-center p-8">Sale or Company Information not found.</div>;
    }

    const subtotal = sale.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalPaid = sale.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    const balanceDue = sale.total - totalPaid;
    const currency = companyInfo.currencySymbol || '₹';

    return (
        <div className="bg-white text-black p-8 font-sans text-sm max-w-2xl mx-auto print:shadow-none print:p-0">
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>
            
            <header className="relative text-center mb-4">
                <h1 className="text-2xl font-bold uppercase">{companyInfo.name}</h1>
                {companyInfo.mobile && <p>Mobile: {companyInfo.mobile}</p>}
                {companyInfo.signature && <Image src={companyInfo.signature} alt="Signature" width={120} height={60} className="absolute top-0 right-0" />}
            </header>

            <div className="border-y-2 border-dashed border-black mb-4">
                <h2 className="text-center text-lg font-bold py-1">Invoice</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
                <div><strong>Invoice:</strong> #{sale.orderId}</div>
                <div className="text-right"><strong>Name:</strong> {customer?.name || sale.customer}</div>
                <div><strong>Mobile:</strong> {customer?.phone}</div>
                <div className="text-right"><strong>Seller:</strong> {sale.createdBy || 'Admin'}</div>
                <div><strong>Date:</strong> {new Date(sale.date).toLocaleDateString()}</div>
                <div className="text-right"><strong>Time:</strong> {new Date(sale.date).toLocaleTimeString()}</div>
            </div>

            <table className="w-full mb-4">
                <thead>
                    <tr className="border-t-2 border-b-2 border-dashed border-black">
                        <th className="text-left py-1">#</th>
                        <th className="text-left py-1">Description</th>
                        <th className="text-right py-1">Price</th>
                        <th className="text-right py-1">Quantity</th>
                        <th className="text-right py-1">Discount</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                         <tr key={index} className="border-b border-dashed border-black">
                            <td className="py-1">{index + 1}</td>
                            <td className="py-1">{item.name}</td>
                            <td className="text-right py-1">{currency}{item.price.toFixed(2)}</td>
                            <td className="text-right py-1">{item.quantity.toFixed(2)}</td>
                            <td className="text-right py-1">{currency}0.00</td>
                            <td className="text-right py-1">{currency}{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="flex justify-end">
                <div className="w-1/2">
                    <div className="flex justify-between border-t border-dashed border-black pt-1">
                        <span>Before Tax:</span>
                        <span>{currency}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax Amount:</span>
                        <span>{currency}{sale.taxAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Other Charges:</span>
                        <span>{currency}{sale.otherCharges.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-bold border-t-2 border-dashed border-black my-1 py-1">
                        <span>Grand Total:</span>
                        <span>{currency}{sale.total.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Total Discount:</span>
                        <span>{currency}{sale.discount.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-semibold">
                        <span>Paid Payment:</span>
                         <span>{currency}{totalPaid.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-bold text-lg text-red-600 border-t-2 border-b-2 border-dashed border-black my-1 py-1">
                        <span>Balance Due:</span>
                        <span>{currency}{balanceDue.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <footer className="mt-8 text-center">
                {companyInfo.footer && <p className="text-xs">{companyInfo.footer}</p>}
                <p className="mt-2 text-xs">https://pos.creatantech.com/pos/print_invoice_pos/{sale.id}</p>
            </footer>
        </div>
    );
}


export default function PrintInvoicePage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Loading invoice...</div>}>
            <InvoiceContent />
        </Suspense>
    )
}

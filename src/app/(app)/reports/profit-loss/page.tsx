
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getItems, type Item } from '@/services/items';
import { getSales, type SaleWithItems } from '@/services/sales';
import { getPurchases, type Purchase } from '@/services/purchases';
import { getExpenses, type Expense } from '@/services/expenses';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, LucideProps, Printer } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';

interface ProfitData {
    openingStock: number;
    totalPurchase: number;
    totalPurchaseDiscount: number;
    purchasePaid: number;
    purchaseDue: number;
    totalPurchaseReturn: number;
    totalExpense: number;
    totalSales: number;
    totalSalesDiscount: number;
    salesPaid: number;
    salesDue: number;
    totalSalesReturn: number;
    grossProfit: number;
    netProfit: number;
}

interface ItemProfit {
    id: string;
    name: string;
    salesQuantity: number;
    salesPrice: number;
    purchasePrice: number;
    grossProfit: number;
}

interface InvoiceProfit {
    id: string;
    orderId: string;
    date: string;
    customer: string;
    totalAmount: number;
    grossProfit: number;
}


export default function ProfitLossPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [loading, setLoading] = useState(true);
    const [profitData, setProfitData] = useState<ProfitData | null>(null);
    const [itemWiseProfit, setItemWiseProfit] = useState<ItemProfit[]>([]);
    const [invoiceWiseProfit, setInvoiceWiseProfit] = useState<InvoiceProfit[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [items, sales, purchases, expenses] = await Promise.all([
                getItems(),
                getSales(),
                getPurchases(),
                getExpenses(),
            ]);

            const salesWithItems = sales as SaleWithItems[];

            const itemsById = new Map(items.map(item => [item.id, item]));

            // This is a simplified calculation logic.
            // A real-world scenario would require more complex logic, especially for stock value.
            const openingStock = items.reduce((acc, item) => acc + (item.purchasePrice * (item.quantity + Math.floor(Math.random() * 10))), 0);
            const totalPurchase = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
            const totalSales = sales.filter(s => s.status !== 'Return').reduce((acc, s) => acc + s.total, 0);
            const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
            
            const costOfGoodsSold = totalPurchase; 
            const grossProfit = totalSales - costOfGoodsSold;
            const netProfit = grossProfit - totalExpense;
            
            const salesDue = totalSales - sales.filter(s => s.status === 'Fulfilled').reduce((acc, s) => acc + s.total, 0);


            setProfitData({
                openingStock,
                totalPurchase,
                totalPurchaseDiscount: 0, // Mock
                purchasePaid: purchases.reduce((acc, p) => acc + p.paidAmount, 0),
                purchaseDue: purchases.reduce((acc, p) => acc + p.dueAmount, 0),
                totalPurchaseReturn: 0, // Mock
                totalExpense,
                totalSales,
                totalSalesDiscount: sales.reduce((acc, s) => acc + s.discount, 0),
                salesPaid: sales.filter(s => s.status === 'Fulfilled').reduce((acc, s) => acc + s.total, 0),
                salesDue,
                totalSalesReturn: sales.filter(s => s.status === 'Return').reduce((acc, s) => acc + s.total, 0),
                grossProfit,
                netProfit,
            });
            
            const itemProfitMap = new Map<string, { name: string; salesQuantity: number; salesPrice: number; purchasePrice: number }>();
            salesWithItems
              .filter(sale => sale.items && sale.status !== 'Return')
              .forEach(sale => {
                sale.items.forEach(saleItem => {
                    const dbItem = itemsById.get(saleItem.itemId);
                    if (dbItem) {
                        const existing = itemProfitMap.get(dbItem.id!) || { name: dbItem.name, salesQuantity: 0, salesPrice: 0, purchasePrice: 0 };
                        existing.salesQuantity += saleItem.quantity;
                        existing.salesPrice += saleItem.price * saleItem.quantity;
                        existing.purchasePrice += (dbItem.purchasePrice || 0) * saleItem.quantity;
                        itemProfitMap.set(dbItem.id!, existing);
                    }
                });
            });

            const calculatedItemProfits = Array.from(itemProfitMap.entries()).map(([id, data]) => ({
                id,
                name: data.name,
                salesQuantity: data.salesQuantity,
                salesPrice: data.salesPrice,
                purchasePrice: data.purchasePrice,
                grossProfit: data.salesPrice - data.purchasePrice,
            }));

            setItemWiseProfit(calculatedItemProfits);

            const calculatedInvoiceProfits = salesWithItems
                .filter(sale => sale.items && sale.status !== 'Return')
                .map(sale => {
                    const costOfSale = sale.items.reduce((acc, saleItem) => {
                        const dbItem = itemsById.get(saleItem.itemId);
                        const itemCost = dbItem?.purchasePrice || 0;
                        return acc + (itemCost * saleItem.quantity);
                    }, 0);

                    const invoiceGrossProfit = sale.total - costOfSale;
                    return {
                        id: sale.id!,
                        orderId: sale.orderId,
                        date: new Date(sale.date).toLocaleDateString(),
                        customer: sale.customer,
                        totalAmount: sale.total,
                        grossProfit: invoiceGrossProfit,
                    };
                });
            
            setInvoiceWiseProfit(calculatedInvoiceProfits);


        } catch (error) {
            console.error("Failed to fetch profit/loss data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePrint = () => {
        window.print();
    }


    return (
        <div className="space-y-6">
            <Card className="print:hidden">
                <CardHeader>
                    <CardTitle>Profit &amp; Loss Report</CardTitle>
                    <CardDescription>Select a date range to generate the report.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="date">Select Date</Label>
                        <DateRangePicker date={date} onDateChange={setDate} />
                    </div>
                     <Button onClick={fetchData} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate'}
                    </Button>
                    <Button onClick={handlePrint} variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </CardContent>
            </Card>

            {loading ? (
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            ) : profitData && (
                <Card>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-semibold">Opening Stock</span>
                                <span>${profitData.openingStock.toFixed(2)}</span>
                            </div>
                            <Separator />
                             <div className="font-bold text-blue-600">Purchase</div>
                             <div className="flex justify-between text-sm ml-4">
                                <span>Total Purchase</span>
                                <span>${profitData.totalPurchase.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm ml-4">
                                <span>Total Discount</span>
                                <span className="text-red-600">(${profitData.totalPurchaseDiscount.toFixed(2)})</span>
                            </div>
                            <div className="flex justify-between text-sm ml-4">
                                <span>Paid Payment</span>
                                <span className="text-red-600">(${profitData.purchasePaid.toFixed(2)})</span>
                            </div>
                             <div className="flex justify-between text-sm font-semibold ml-4">
                                <span>Purchase Due</span>
                                <span>${profitData.purchaseDue.toFixed(2)}</span>
                            </div>
                             <div className="font-bold text-blue-600">Purchase Return</div>
                             <div className="flex justify-between text-sm ml-4">
                                <span>Total Purchase Return</span>
                                <span className="text-red-600">(${profitData.totalPurchaseReturn.toFixed(2)})</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <div className="flex justify-between">
                                <span className="font-semibold">Total Expense</span>
                                <span className="text-red-600">(${profitData.totalExpense.toFixed(2)})</span>
                            </div>
                            <Separator />
                            <div className="font-bold text-green-600">Sales</div>
                            <div className="flex justify-between text-sm ml-4">
                                <span>Total Sales</span>
                                <span>${profitData.totalSales.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between text-sm ml-4">
                                <span>Total Discount</span>
                                <span className="text-red-600">(${profitData.totalSalesDiscount.toFixed(2)})</span>
                            </div>
                             <div className="flex justify-between text-sm ml-4">
                                <span>Paid Payment</span>
                                <span>${profitData.salesPaid.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between text-sm font-semibold ml-4">
                                <span>Sales Due</span>
                                <span className="text-red-600">(${profitData.salesDue.toFixed(2)})</span>
                            </div>
                             <div className="font-bold text-green-600">Sales Return</div>
                             <div className="flex justify-between text-sm ml-4">
                                <span>Total Sales Return</span>
                                <span>(${profitData.totalSalesReturn.toFixed(2)})</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 border-t p-6">
                         <div className="w-full flex justify-between font-bold text-lg text-green-600">
                            <span>Gross Profit</span>
                            <span>${profitData.grossProfit.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="w-full flex justify-between font-bold text-lg text-green-600">
                            <span>Net Profit</span>
                            <span>${profitData.netProfit.toFixed(2)}</span>
                        </div>
                    </CardFooter>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <Tabs defaultValue="item-wise">
                        <TabsList className="m-4 print:hidden">
                            <TabsTrigger value="item-wise">Item Wise Profit</TabsTrigger>
                            <TabsTrigger value="invoice-wise">Invoice Wise Profit</TabsTrigger>
                        </TabsList>
                        <TabsContent value="item-wise" className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead className="text-right">Sales Quantity</TableHead>
                                        <TableHead className="text-right">Sales Price</TableHead>
                                        <TableHead className="text-right">Purchase Price</TableHead>
                                        <TableHead className="text-right">Gross Profit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        itemWiseProfit.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">{item.salesQuantity}</TableCell>
                                                <TableCell className="text-right">${item.salesPrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">${item.purchasePrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-semibold text-green-600">${item.grossProfit.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                                <TableFooter>
                                     <TableRow>
                                        <TableCell colSpan={5} className="text-right font-bold">Total Gross Profit</TableCell>
                                        <TableCell className="text-right font-bold text-lg text-green-600">${itemWiseProfit.reduce((acc, item) => acc + item.grossProfit, 0).toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TabsContent>
                         <TabsContent value="invoice-wise">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-right">Sale Amount</TableHead>
                                        <TableHead className="text-right">Gross Profit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        invoiceWiseProfit.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell>{invoice.orderId}</TableCell>
                                                <TableCell>{invoice.date}</TableCell>
                                                <TableCell>{invoice.customer}</TableCell>
                                                <TableCell className="text-right">${invoice.totalAmount.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-semibold text-green-600">${invoice.grossProfit.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                                <TableFooter>
                                     <TableRow>
                                        <TableCell colSpan={4} className="text-right font-bold">Total Gross Profit</TableCell>
                                        <TableCell className="text-right font-bold text-lg text-green-600">${invoiceWiseProfit.reduce((acc, item) => acc + item.grossProfit, 0).toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

function DateRangePicker({
  date,
  onDateChange,
  className,
}: {
  date?: DateRange;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

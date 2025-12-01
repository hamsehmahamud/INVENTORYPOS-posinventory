
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Award,
  Calendar as CalendarIcon,
  ShoppingBag,
  Receipt,
  ClipboardList,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { getSales, type SaleWithItems } from '@/services/sales';
import { getPurchases, type Purchase } from '@/services/purchases';
import { getItems, type Item } from '@/services/items';
import { getUsers, type User } from '@/services/users';
import { getCustomers, type Customer } from '@/services/customers';
import { getExpenses, type Expense } from '@/services/expenses';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompany } from '@/context/company-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isToday, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const chartConfig = {
  sales: { label: 'Sales', color: 'hsl(var(--chart-1))' },
  purchase: { label: 'Purchase', color: 'hsl(var(--chart-2))' },
};

const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1'];


type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export default function DashboardPage() {
  const { user } = useAuth();
  const { companyInfo, loading: companyLoading } = useCompany();
  const [sales, setSales] = useState<SaleWithItems[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<FilterType>('monthly');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [
          fetchedSales,
          fetchedPurchases,
          fetchedItems,
          fetchedUsers,
          fetchedCustomers,
          fetchedExpenses,
        ] = await Promise.all([
          getSales(),
          getPurchases(),
          getItems(),
          getUsers(),
          getCustomers(),
          getExpenses(),
        ]);
        setSales(fetchedSales);
        setPurchases(fetchedPurchases);
        setItems(fetchedItems);
        setUsers(fetchedUsers);
        setCustomers(fetchedCustomers);
        setExpenses(fetchedExpenses);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    const today = new Date();
     if (type === 'custom') {
      // For custom, we let the popover handle the date range
      return;
    }
    switch (type) {
      case 'daily':
        setDateRange({ from: today, to: today });
        break;
      case 'weekly':
        setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
        break;
      case 'monthly':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case 'yearly':
        setDateRange({ from: startOfYear(today), to: endOfYear(today) });
        break;
    }
  };
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setFilterType('custom');
  }
  
  const currency = companyInfo?.currencySymbol || '₹';

  const filteredData = useMemo(() => {
    const { from, to } = dateRange || {};
    if (!from || !to) {
        return { sales, purchases, expenses, customers, items };
    }
    const range = { start: from, end: to };
    return {
        sales: sales.filter(s => isWithinInterval(new Date(s.date), range)),
        purchases: purchases.filter(p => isWithinInterval(new Date(p.date), range)),
        expenses: expenses.filter(e => isWithinInterval(new Date(e.date), range)),
        customers,
        items,
    }

  }, [sales, purchases, expenses, customers, items, dateRange])


  const dashboardData = useMemo(() => {
    const { sales: currentSales, purchases: currentPurchases, expenses: currentExpenses, customers: currentCustomers } = filteredData;
    
    const totalPurchaseDue = currentPurchases.reduce((acc, p) => acc + p.dueAmount, 0);
    const totalSalesDue = currentSales.reduce((acc, s) => {
        const isPaid = s.status === 'Fulfilled';
        const due = isPaid ? 0 : s.total;
        return acc + due;
    }, 0);
    const totalSalesAmount = currentSales.reduce((acc, s) => acc + s.total, 0);
    const totalExpenseAmount = currentExpenses.reduce((acc, e) => acc + e.amount, 0);
    const todaysTotalPurchase = purchases.filter(p => isToday(new Date(p.date))).reduce((acc, p) => acc + p.totalAmount, 0);
    const todaysPaymentReceived = 0; // Mock data
    const todaysTotalSales = sales.filter(s => isToday(new Date(s.date))).reduce((acc, s) => acc + s.total, 0);
    const todaysTotalExpense = expenses.filter(e => isToday(new Date(e.date))).reduce((acc, e) => acc + e.amount, 0);
    const totalCustomers = currentCustomers.length;
    const totalSuppliers = new Set(currentPurchases.map(p => p.supplier)).size;
    const totalPurchaseInvoices = currentPurchases.length;
    const totalSalesInvoices = currentSales.length;

    return {
        totalPurchaseDue,
        totalSalesDue,
        totalSalesAmount,
        totalExpenseAmount,
        todaysTotalPurchase,
        todaysPaymentReceived,
        todaysTotalSales,
        todaysTotalExpense,
        totalCustomers,
        totalSuppliers,
        totalPurchaseInvoices,
        totalSalesInvoices
    }
  }, [filteredData, purchases, sales, expenses]);


  const chartData = useMemo(() => {
    const { sales: currentSales, purchases: currentPurchases } = filteredData;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dataByMonth: { [key: string]: { month: string, purchase: number, sales: number } } = {};

    monthNames.forEach(month => {
        dataByMonth[month] = { month, purchase: 0, sales: 0 };
    });

    currentPurchases.forEach(p => {
        const month = monthNames[new Date(p.date).getMonth()];
        dataByMonth[month].purchase += p.totalAmount;
    });
    currentSales.forEach(s => {
        const month = monthNames[new Date(s.date).getMonth()];
        dataByMonth[month].sales += s.total;
    });

    return Object.values(dataByMonth);
  }, [filteredData]);

  const recentlyAddedItems = useMemo(() => items.slice(0, 5), [items]);
  const expiredItems = useMemo(() => {
    const today = new Date();
    return items.filter(item => item.expiryDate && new Date(item.expiryDate) < today).slice(0, 5);
  }, [items]);
  const stockAlerts = useMemo(() => items.filter(item => item.quantity <= item.minQuantity).slice(0, 5), [items]);

  const trendingItems = useMemo(() => {
    const { sales: currentSales } = filteredData;
    const itemCounts = currentSales
      .flatMap(s => s.items)
      .reduce((acc, item) => {
        if (item && item.name) {
          acc[item.name] = (acc[item.name] || 0) + item.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));
  }, [filteredData]);


  return (
    <div className="grid gap-6 md:gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Welcome, {user?.displayName || 'User'}!</h1>
          <p className="text-muted-foreground">Here&apos;s a quick overview of your business performance.</p>
        </div>
         <div className="flex items-center gap-2">
          <Button variant={filterType === 'daily' ? 'default' : 'outline'} onClick={() => handleFilterChange('daily')}>Daily</Button>
          <Button variant={filterType === 'weekly' ? 'default' : 'outline'} onClick={() => handleFilterChange('weekly')}>Weekly</Button>
          <Button variant={filterType === 'monthly' ? 'default' : 'outline'} onClick={() => handleFilterChange('monthly')}>Monthly</Button>
          <Button variant={filterType === 'yearly' ? 'default' : 'outline'} onClick={() => handleFilterChange('yearly')}>Yearly</Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={filterType === 'custom' ? 'default' : 'outline'}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-cyan-500 text-white"><CardContent className="p-4"><div className="flex justify-between items-center"><ShoppingBag className="h-8 w-8" /><div><p>Total Purchase Due</p><p className="text-2xl font-bold text-right">{currency}{dashboardData.totalPurchaseDue.toFixed(2)}</p></div></div></CardContent></Card>
          <Card className="bg-orange-500 text-white"><CardContent className="p-4"><div className="flex justify-between items-center"><DollarSign className="h-8 w-8" /><div><p>Total Sales Due</p><p className="text-2xl font-bold text-right">{currency}{dashboardData.totalSalesDue.toFixed(2)}</p></div></div></CardContent></Card>
          <Card className="bg-teal-500 text-white"><CardContent className="p-4"><div className="flex justify-between items-center"><ShoppingCart className="h-8 w-8" /><div><p>Total Sales Amount</p><p className="text-2xl font-bold text-right">{currency}{dashboardData.totalSalesAmount.toFixed(2)}</p></div></div></CardContent></Card>
          <Card className="bg-red-500 text-white"><CardContent className="p-4"><div className="flex justify-between items-center"><Receipt className="h-8 w-8" /><div><p>Total Expense Amount</p><p className="text-2xl font-bold text-right">{currency}{dashboardData.totalExpenseAmount.toFixed(2)}</p></div></div></CardContent></Card>
          <Card className="bg-cyan-500 text-white"><CardContent className="p-4"><div className="flex justify-between items-center"><ShoppingBag className="h-8 w-8" /><div><p>Today's Total Purchase</p><p className="text-2xl font-bold text-right">{currency}{dashboardData.todaysTotalPurchase.toFixed(2)}</p></div></div></CardContent></Card>
          <Card className="bg-orange-500 text-white"><CardContent className="p-4"><div className="flex justify-between items-center"><DollarSign className="h-8 w-8" /><div><p>Today's Payment Received</p><p className="text-2xl font-bold text-right">{currency}{dashboardData.todaysPaymentReceived.toFixed(2)}</p></div></div></CardContent></Card>
          <Card className="bg-teal-500 text-white"><CardContent className="p-4"><div className="flex justify-between items-center"><ShoppingCart className="h-8 w-8" /><div><p>Today's Total Sales</p><p className="text-2xl font-bold text-right">{currency}{dashboardData.todaysTotalSales.toFixed(2)}</p></div></div></CardContent></Card>
          <Card className="bg-red-500 text-white"><CardContent className="p-4"><div className="flex justify-between items-center"><Receipt className="h-8 w-8" /><div><p>Today's Total Expense</p><p className="text-2xl font-bold text-right">{currency}{dashboardData.todaysTotalExpense.toFixed(2)}</p></div></div></CardContent></Card>
          <Card className="bg-fuchsia-800 text-white"><CardHeader className="p-2"><CardTitle className="text-lg">{dashboardData.totalCustomers}</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p>Customers</p></CardContent><CardFooter className="p-2"><Link href="/customers" className="text-xs flex items-center gap-1">View <Eye className="h-3 w-3" /></Link></CardFooter></Card>
          <Card className="bg-purple-800 text-white"><CardHeader className="p-2"><CardTitle className="text-lg">{dashboardData.totalSuppliers}</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p>Suppliers</p></CardContent><CardFooter className="p-2"><Link href="/suppliers" className="text-xs flex items-center gap-1">View <Eye className="h-3 w-3" /></Link></CardFooter></Card>
          <Card className="bg-blue-800 text-white"><CardHeader className="p-2"><CardTitle className="text-lg">{dashboardData.totalPurchaseInvoices}</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p>Purchase Invoices</p></CardContent><CardFooter className="p-2"><Link href="/purchase" className="text-xs flex items-center gap-1">View <Eye className="h-3 w-3" /></Link></CardFooter></Card>
          <Card className="bg-green-800 text-white"><CardHeader className="p-2"><CardTitle className="text-lg">{dashboardData.totalSalesInvoices}</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p>Sales Invoices</p></CardContent><CardFooter className="p-2"><Link href="/sales" className="text-xs flex items-center gap-1">View <Eye className="h-3 w-3" /></Link></CardFooter></Card>
      </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
         <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Purchase & Sales Bar Chart</CardTitle></CardHeader>
          <CardContent className="pl-2">
            {loading ? <Skeleton className="h-[300px] w-full" /> : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="purchase" fill="var(--color-purchase)" radius={4} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
              </BarChart>
            </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Recently Added Items</CardTitle></CardHeader>
          <CardContent><Table><TableHeader><TableRow><TableHead>Sl.No</TableHead><TableHead>Item Name</TableHead><TableHead>Item Sales Price</TableHead></TableRow></TableHeader><TableBody>
            {loading ? Array.from({length: 5}).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-5 w-5" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-16" /></TableCell></TableRow>))
            : recentlyAddedItems.map((item, i) => (
              <TableRow key={`${item.id}-${i}`}><TableCell>{i+1}</TableCell><TableCell>{item.name}</TableCell><TableCell>{currency}{item.price.toFixed(2)}</TableCell></TableRow>
            ))}
          </TableBody></Table></CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Expired Items</CardTitle></CardHeader>
          <CardContent><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Item Code</TableHead><TableHead>Item Name</TableHead><TableHead>Category Name</TableHead><TableHead>Expire Date</TableHead></TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={5}><Skeleton className="h-20 w-full"/></TableCell></TableRow> : expiredItems.map((item, i) => (
                <TableRow key={item.id}><TableCell>{i+1}</TableCell><TableCell>{item.sku}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.expiryDate ? format(new Date(item.expiryDate), 'dd-MM-yyyy') : ''}</TableCell></TableRow>
            ))}
          </TableBody></Table></CardContent>
        </Card>
         <Card>
          <CardHeader><CardTitle>Stock Alert</CardTitle></CardHeader>
          <CardContent><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Item Name</TableHead><TableHead>Category Name</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full"/></TableCell></TableRow> : stockAlerts.map((item, i) => (
                <TableRow key={item.id}><TableCell>{i+1}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.quantity}</TableCell></TableRow>
            ))}
          </TableBody></Table></CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader><CardTitle>Top 10 Trending Items %</CardTitle></CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-[300px] w-full" /> : (
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <PieChart>
                        <Pie data={trendingItems} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {trendingItems.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </PieChart>
                </ChartContainer>
             )}
          </CardContent>
      </Card>

    </div>
  );
}

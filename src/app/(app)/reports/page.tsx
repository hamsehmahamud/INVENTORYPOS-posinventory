
'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, FileText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

const reports = [
    { title: "Profit & Loss Report", description: "Summary of revenues, costs, and expenses.", href: "/reports/profit-loss" },
    { title: "Purchase Report", description: "Detailed list of all purchase orders.", href: "/reports/purchase" },
    { title: "Purchase Return Report", description: "All purchase returns within a date range.", href: "/reports/purchase-return" },
    { title: "Purchase Payments Report", description: "Report of payments made for purchases.", href: "/reports/purchase-payments" },
    { title: "Item Sales Report", description: "Sales data for individual items.", href: "/reports/item-sales" },
    { title: "Item Purchase Report", description: "Purchase data for individual items.", href: "/reports/item-purchase" },
    { title: "Sales Report", description: "A summary of all sales transactions.", href: "/reports/sales" },
    { title: "Sales Return Report", description: "All sales returns within a date range.", href: "/reports/sales-return" },
    { title: "Sales Payments Report", description: "Report of payments received from sales.", href: "/reports/sales-payments" },
    { title: "Stock Report", description: "Current stock levels for all products.", href: "/reports/stock" },
    { title: "Expense Report", description: "A detailed breakdown of all business expenses.", href: "/reports/expense" },
    { title: "Expired Items Report", description: "List of items that have expired.", href: "/reports/expired-items" },
    { title: "Customer Statement", description: "Generate a statement for a customer.", href: "/reports/customer-statement" },
    { title: "Supplier Statement", description: "Generate a statement for a supplier.", href: "/reports/supplier-statement" },
];

export default function ReportsPage() {
  const { userProfile } = useAuth();
  
  const hasPermission = (reportHref: string) => {
    if (userProfile?.role === 'Admin') return true;
    const reportPermissions: { [key: string]: string } = {
        '/reports/sales': 'sales-view',
        '/reports/purchase': 'purchases-view',
        '/reports/profit-loss': 'reports-view-all',
        '/reports/stock': 'reports-view-all',
        '/reports/customer-statement': 'reports-view-all',
        '/reports/supplier-statement': 'reports-view-all',
    }
    const requiredPermission = reportPermissions[reportHref];
    if (!requiredPermission) return true;
    return userProfile?.permissions?.includes(requiredPermission);
  }

  const accessibleReports = reports.filter(report => hasPermission(report.href));

  return (
    <div className="grid gap-6">
        <CardHeader className="p-0">
            <CardTitle>Reports</CardTitle>
            <CardDescription>Generate and export reports for your business.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accessibleReports.map(report => (
                <Card key={report.title}>
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="grid gap-1">
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" asChild>
                            <Link href={report.href}>View Report</Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/settings/report-settings">
                                <Settings className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
  );
}

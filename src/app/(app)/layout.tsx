
"use client";
import React, { useEffect, Suspense, useState, useCallback } from "react";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset,
    SidebarMenuSub,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { Logo, MenuToggleIcon, MbPosLogo } from "@/components/icons";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    FileText,
    Settings,
    Lightbulb,
    Calculator,
    PlusSquare,
    List,
    Undo2,
    Boxes,
    Printer,
    Import,
    Users2,
    Shield,
    Loader2,
    Truck,
    Building,
    Plane,
    Receipt,
    UserRound,
    FileBarChart,
    HelpCircle,
    Building2,
    SlidersHorizontal,
    Percent,
    Ruler,
    Wallet,
    CircleDollarSign,
    KeyRound,
    DatabaseBackup,
    Map,
    MapPin,
    BookUser,
    Send,
    Warehouse,
    ArrowRightLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/components/ui/sidebar";
import { HoldProvider } from "@/context/hold-context";
import { useLoading } from "@/context/loading-context";
import Image from "next/image";
import { LoadingIndicator } from "@/components/ui/loading-indicator";


const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const itemsLinks = [
    { href: "/items", label: "Items List", icon: List, permission: 'items-view' },
    { href: "/items/new", label: "New Item", icon: PlusSquare, permission: 'items-create' },
    { href: "/items/categories", label: "Categories", icon: List, permission: 'items-view' },
    { href: "/items/brands", label: "Brands List", icon: List, permission: 'items-view' },
    { href: "/items/brands/new", label: "New Brand", icon: PlusSquare, permission: 'items-create' },
    { href: "/items/labels", label: "Print Labels", icon: Printer, permission: 'items-labels' },
    { href: "/items/import", label: "Import Items", icon: Import, permission: 'items-import' },
];

const salesLinks = [
    { href: "/pos", label: "POS", icon: Calculator, permission: 'sales-create' },
    { href: "/sales", label: "Sales List", icon: List, permission: 'sales-view' },
    { href: "/sales/new", label: "New Sales", icon: PlusSquare, permission: 'sales-create' },
    { href: "/sales/returns", label: "Sales Returns List", icon: Undo2, permission: 'sales-returns' },
    { href: "/sales/returns/new", label: "New Sales Return", icon: PlusSquare, permission: 'sales-returns' },
]

const purchaseLinks = [
    { href: "/purchase", label: "Purchase List", icon: List, permission: 'purchases-view' },
    { href: "/purchase/new", label: "New Purchase", icon: PlusSquare, permission: 'purchases-create' },
    { href: "/purchase/returns", label: "Purchase Returns List", icon: Undo2, permission: 'purchases-returns' },
    { href: "/purchase/returns/new", label: "New Purchase Return", icon: PlusSquare, permission: 'purchases-returns' },
];

const customersLinks = [
    { href: "/customers", label: "List Customers", icon: List, permission: 'customers-view' },
    { href: "/customers/new", label: "New Customer", icon: PlusSquare, permission: 'customers-create' },
    { href: "/customers/import", label: "Import Customers", icon: Import, permission: 'customers-import' },
];

const suppliersLinks = [
    { href: "/suppliers", label: "List Suppliers", icon: List, permission: 'suppliers-view' },
    { href: "/suppliers/new", label: "New Supplier", icon: PlusSquare, permission: 'suppliers-create' },
    { href: "/suppliers/import", label: "Import Suppliers", icon: Import, permission: 'suppliers-import' },
];

const warehouseLinks = [
    { href: "/warehouses", label: "Warehouse List", icon: List, permission: 'items-view' },
    { href: "/warehouses/new", label: "Add Warehouse", icon: PlusSquare, permission: 'items-create' },
    { href: "/warehouses/transfers", label: "Stock Transfer", icon: ArrowRightLeft, permission: 'items-edit' },
];

const expensesLinks = [
    { href: "/expenses/new", label: "New Expense", icon: PlusSquare, permission: 'expenses-create' },
    { href: "/expenses", label: "Expense List", icon: List, permission: 'expenses-view' },
    { href: "/expenses/categories", label: "Categories", icon: List, permission: 'expenses-view' },
];

const accountingLinks = {
    receivable: [
        { href: "/accounting/receivable/invoices", label: "Invoices", icon: FileText, permission: 'accounting-view' },
        { href: "/accounting/receivable/reports", label: "Reports", icon: FileBarChart, permission: 'accounting-view' },
    ],
    payable: [
        { href: "/accounting/payable/bills", label: "Bills", icon: Receipt, permission: 'accounting-view' },
        { href: "/accounting/payable/reports", label: "Reports", icon: FileBarChart, permission: 'accounting-view' },
    ],
    payments: [
        { href: "/accounting/payments/new", label: "New Payment", icon: PlusSquare, permission: 'payments-manage' },
        { href: "/accounting/payments/list", label: "Payments List", icon: List, permission: 'payments-manage' },
    ],
    supplierPayments: [
        { href: "/accounting/supplier-payments/new", label: "New Supplier Payment", icon: PlusSquare, permission: 'payments-manage' },
        { href: "/accounting/supplier-payments/list", label: "Payments List", icon: List, permission: 'payments-manage' },
    ],
    statements: [
        { href: "/reports/customer-statement", label: "Customer Statements", icon: BookUser, permission: 'reports-view-all' },
        { href: "/reports/supplier-statement", label: "Supplier Statements", icon: Building2, permission: 'reports-view-all' },
    ]
};

const placesLinks = [
    { href: "/places/new-country", label: "New Country", icon: PlusSquare, permission: 'settings-manage' },
    { href: "/places/countries", label: "Countries List", icon: List, permission: 'settings-manage' },
    { href: "/places/new-state", label: "New State", icon: PlusSquare, permission: 'settings-manage' },
    { href: "/places/states", label: "States List", icon: List, permission: 'settings-manage' },
];


const usersLinks = [
    { href: "/users/new", label: "New User", icon: PlusSquare, permission: 'users-create' },
    { href: "/users", label: "Users List", icon: List, permission: 'users-view' },
    { href: "/users/roles", label: "Roles List", icon: Shield, permission: 'roles-view' },
];

const reportsLinks = [
    { href: "/reports/profit-loss", label: "Profit & Loss Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/purchase", label: "Purchase Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/purchase-return", label: "Purchase Return Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/purchase-payments", label: "Purchase Payments Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/item-sales", label: "Item Sales Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/item-purchase", label: "Item Purchase Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/sales", label: "Sales Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/sales-return", label: "Sales Return Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/sales-payments", label: "Sales Payments Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/stock", label: "Stock Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/expense", label: "Expense Report", icon: FileText, permission: 'reports-view-all' },
    { href: "/reports/expired-items", label: "Expired Items Report", icon: FileText, permission: 'reports-view-all' },
];

const settingsLinks = [
    { href: "/settings/site-settings", label: "Site Settings", icon: SlidersHorizontal, permission: 'settings-manage' },
    { href: "/settings/invoice-settings", label: "Invoice Settings", icon: Receipt, permission: 'settings-manage' },
    { href: "/settings/report-settings", label: "Report Settings", icon: FileText, permission: 'settings-manage' },
    { href: "/settings/tax-list", label: "Tax List", icon: Percent, permission: 'settings-manage' },
    { href: "/settings/units-list", label: "Units List", icon: Ruler, permission: 'settings-manage' },
    { href: "/settings/payment-types-list", label: "Payment Types List", icon: Wallet, permission: 'settings-manage' },
    { href: "/settings/currency-list", label: "Currency List", icon: CircleDollarSign, permission: 'settings-manage' },
    { href: "/settings/change-password", label: "Change Password", icon: KeyRound, permission: 'settings-manage' },
    { href: "/settings/database-backup", label: "Backup / Restore", icon: DatabaseBackup, permission: 'settings-manage' },
];

const bottomLinks = [
    { href: "/ai-support", label: "AI Support", icon: Lightbulb },
    { href: "/help", label: "Help", icon: HelpCircle },
]

function AppSidebar() {
    const { companyInfo } = useCompany();
    const { userProfile } = useAuth();
    const { toggleSidebar, state } = useSidebar();
    const pathname = usePathname();

    const hasPermission = useCallback((permission: string | string[]) => {
        if (userProfile?.role === 'Admin') return true;
        if (!userProfile?.permissions) return false;
        if (Array.isArray(permission)) {
            return permission.some(p => userProfile.permissions!.includes(p));
        }
        return userProfile.permissions.includes(permission);
    }, [userProfile]);

    const isSalesActive = pathname.startsWith('/sales') || pathname === '/pos';
    const isItemsActive = pathname.startsWith('/items');
    const isCustomersActive = pathname.startsWith('/customers');
    const isPurchaseActive = pathname.startsWith('/purchase');
    const isSuppliersActive = pathname.startsWith('/suppliers');
    const isWarehouseActive = pathname.startsWith('/warehouses');
    const isExpensesActive = pathname.startsWith('/expenses');
    const isAccountingActive = pathname.startsWith('/accounting');
    const isPlacesActive = pathname.startsWith('/places');
    const isUsersActive = pathname.startsWith('/users');
    const isReportsActive = pathname.startsWith('/reports');
    const isSettingsActive = pathname.startsWith('/settings');

    const [openMenu, setOpenMenu] = useState<string | null>(() => {
        if (isSalesActive) return 'sales';
        if (isItemsActive) return 'items';
        if (isCustomersActive) return 'customers';
        if (isPurchaseActive) return 'purchase';
        if (isSuppliersActive) return 'suppliers';
        if (isWarehouseActive) return 'warehouse';
        if (isExpensesActive) return 'expenses';
        if (isAccountingActive) return 'accounting';
        if (isPlacesActive) return 'places';
        if (isUsersActive) return 'users';
        if (isReportsActive) return 'reports';
        if (isSettingsActive) return 'settings';
        return null;
    });

    const handleMenuOpenChange = (menu: string) => (isOpen: boolean) => {
        setOpenMenu(isOpen ? menu : null);
    };

    const filterLinks = (links: any[]) => links.filter(link => hasPermission(link.permission));

    return (
        <Sidebar>
            <div className="flex h-full flex-col">
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-primary hover:bg-transparent" asChild>
                            <Link href="/dashboard">
                                {companyInfo?.logo ? <Image src={companyInfo.logo} alt="Logo" width={32} height={32} /> : <Logo className="h-8 w-8" />}
                            </Link>
                        </Button>
                        <h2 className="text-lg font-semibold tracking-tighter sidebar-shown">{companyInfo?.name || <Skeleton className="h-6 w-32" />}</h2>
                    </div>
                </SidebarHeader>
                <div className="flex flex-1 flex-col">
                    <SidebarContent>
                        <div className="group/menu relative">
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton tooltip="Toggle Sidebar" onClick={toggleSidebar} className="hidden justify-end group-data-[collapsible=icon]/sidebar-wrapper:flex">
                                        <MenuToggleIcon />
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                {navLinks.map((link) => (
                                    <SidebarMenuItem key={link.href}>
                                        <SidebarMenuButton asChild tooltip={link.label} isActive={pathname.startsWith(link.href)}>
                                            <Link href={link.href}>
                                                <link.icon />
                                                <span className="sidebar-shown">{link.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}

                                {hasPermission(['sales-view', 'sales-create', 'sales-returns']) && (
                                    <Collapsible open={openMenu === 'sales'} onOpenChange={handleMenuOpenChange('sales')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Sales" isActive={isSalesActive}>
                                                    <ShoppingCart />
                                                    <span className="sidebar-shown">Sales</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(salesLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission(['customers-view', 'customers-create', 'customers-import']) && (
                                    <Collapsible open={openMenu === 'customers'} onOpenChange={handleMenuOpenChange('customers')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Customers" isActive={isCustomersActive}>
                                                    <UserRound />
                                                    <span className="sidebar-shown">Customers</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(customersLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission(['purchases-view', 'purchases-create', 'purchases-returns']) && (
                                    <Collapsible open={openMenu === 'purchase'} onOpenChange={handleMenuOpenChange('purchase')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Purchase" isActive={isPurchaseActive}>
                                                    <Truck />
                                                    <span className="sidebar-shown">Purchase</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(purchaseLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission(['suppliers-view', 'suppliers-create', 'suppliers-import']) && (
                                    <Collapsible open={openMenu === 'suppliers'} onOpenChange={handleMenuOpenChange('suppliers')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Suppliers" isActive={isSuppliersActive}>
                                                    <Building />
                                                    <span className="sidebar-shown">Suppliers</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(suppliersLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission(['items-view', 'items-create', 'items-edit']) && (
                                    <Collapsible open={openMenu === 'warehouse'} onOpenChange={handleMenuOpenChange('warehouse')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Warehouse" isActive={isWarehouseActive}>
                                                    <Warehouse />
                                                    <span className="sidebar-shown">Warehouse</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(warehouseLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}


                                {hasPermission(['items-view', 'items-create', 'items-edit', 'items-delete', 'items-import', 'items-labels']) && (
                                    <Collapsible open={openMenu === 'items'} onOpenChange={handleMenuOpenChange('items')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Items" isActive={isItemsActive}>
                                                    <Boxes />
                                                    <span className="sidebar-shown">Items</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(itemsLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission(['expenses-view', 'expenses-create', 'expenses-edit', 'expenses-delete']) && (
                                    <Collapsible open={openMenu === 'expenses'} onOpenChange={handleMenuOpenChange('expenses')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Expenses" isActive={isExpensesActive}>
                                                    <Receipt />
                                                    <span className="sidebar-shown">Expenses</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(expensesLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission(['accounting-view', 'payments-manage', 'reports-view-all']) && (
                                    <Collapsible open={openMenu === 'accounting'} onOpenChange={handleMenuOpenChange('accounting')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Accounting" isActive={isAccountingActive}>
                                                    <BookUser />
                                                    <span className="sidebar-shown">Accounting</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {hasPermission('accounting-view') && (
                                                    <Collapsible>
                                                        <SidebarMenuItem>
                                                            <CollapsibleTrigger asChild>
                                                                <SidebarMenuButton
                                                                    tooltip="Account Receivable"
                                                                    isActive={pathname.startsWith('/accounting/receivable')}
                                                                >
                                                                    <FileText />
                                                                    <span className="sidebar-shown">Account Receivable</span>
                                                                </SidebarMenuButton>
                                                            </CollapsibleTrigger>
                                                        </SidebarMenuItem>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {filterLinks(accountingLinks.receivable).map((link) => (
                                                                    <SidebarMenuItem key={link.href}>
                                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                                            <Link href={link.href}>
                                                                                <link.icon />
                                                                                <span className="sidebar-shown">{link.label}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuItem>
                                                                ))}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                )}

                                                {hasPermission('accounting-view') && (
                                                    <Collapsible>
                                                        <SidebarMenuItem>
                                                            <CollapsibleTrigger asChild>
                                                                <SidebarMenuButton
                                                                    tooltip="Account Payable"
                                                                    isActive={pathname.startsWith('/accounting/payable')}
                                                                >
                                                                    <Receipt />
                                                                    <span className="sidebar-shown">Account Payable</span>
                                                                </SidebarMenuButton>
                                                            </CollapsibleTrigger>
                                                        </SidebarMenuItem>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {filterLinks(accountingLinks.payable).map((link) => (
                                                                    <SidebarMenuItem key={link.href}>
                                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                                            <Link href={link.href}>
                                                                                <link.icon />
                                                                                <span className="sidebar-shown">{link.label}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuItem>
                                                                ))}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                )}

                                                {hasPermission('payments-manage') && (
                                                    <Collapsible>
                                                        <SidebarMenuItem>
                                                            <CollapsibleTrigger asChild>
                                                                <SidebarMenuButton
                                                                    tooltip="Customer Payments"
                                                                    isActive={pathname.startsWith('/accounting/payments')}
                                                                >
                                                                    <Wallet />
                                                                    <span className="sidebar-shown">Customer Payments</span>
                                                                </SidebarMenuButton>
                                                            </CollapsibleTrigger>
                                                        </SidebarMenuItem>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {filterLinks(accountingLinks.payments).map((link) => (
                                                                    <SidebarMenuItem key={link.href}>
                                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                                            <Link href={link.href}>
                                                                                <link.icon />
                                                                                <span className="sidebar-shown">{link.label}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuItem>
                                                                ))}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                )}

                                                {hasPermission('payments-manage') && (
                                                    <Collapsible>
                                                        <SidebarMenuItem>
                                                            <CollapsibleTrigger asChild>
                                                                <SidebarMenuButton
                                                                    tooltip="Supplier Payments"
                                                                    isActive={pathname.startsWith('/accounting/supplier-payments')}
                                                                >
                                                                    <Send />
                                                                    <span className="sidebar-shown">Supplier Payments</span>
                                                                </SidebarMenuButton>
                                                            </CollapsibleTrigger>
                                                        </SidebarMenuItem>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {filterLinks(accountingLinks.supplierPayments).map((link) => (
                                                                    <SidebarMenuItem key={link.href}>
                                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                                            <Link href={link.href}>
                                                                                <link.icon />
                                                                                <span className="sidebar-shown">{link.label}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuItem>
                                                                ))}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                )}

                                                {hasPermission('reports-view-all') && (
                                                    <Collapsible>
                                                        <SidebarMenuItem>
                                                            <CollapsibleTrigger asChild>
                                                                <SidebarMenuButton
                                                                    tooltip="Statements"
                                                                    isActive={pathname.startsWith('/reports/customer-statement') || pathname.startsWith('/reports/supplier-statement')}
                                                                >
                                                                    <FileBarChart />
                                                                    <span className="sidebar-shown">Statements</span>
                                                                </SidebarMenuButton>
                                                            </CollapsibleTrigger>
                                                        </SidebarMenuItem>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {filterLinks(accountingLinks.statements).map((link) => (
                                                                    <SidebarMenuItem key={link.href}>
                                                                        <SidebarMenuSubButton asChild isActive={pathname.startsWith(link.href)}>
                                                                            <Link href={link.href}>
                                                                                <link.icon />
                                                                                <span className="sidebar-shown">{link.label}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuItem>
                                                                ))}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                )}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}


                                {hasPermission('settings-manage') && (
                                    <Collapsible open={openMenu === 'places'} onOpenChange={handleMenuOpenChange('places')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Places" isActive={isPlacesActive}>
                                                    <Plane />
                                                    <span className="sidebar-shown">Places</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(placesLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission('reports-view-all') && (
                                    <Collapsible open={openMenu === 'reports'} onOpenChange={handleMenuOpenChange('reports')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Reports" isActive={isReportsActive}>
                                                    <FileBarChart />
                                                    <span className="sidebar-shown">Reports</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(reportsLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname.startsWith(link.href)}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission(['users-view', 'users-create', 'roles-view']) && (
                                    <Collapsible open={openMenu === 'users'} onOpenChange={handleMenuOpenChange('users')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Users" isActive={isUsersActive}>
                                                    <Users />
                                                    <span className="sidebar-shown">Users</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(usersLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {hasPermission('settings-manage') && (
                                    <Collapsible open={openMenu === 'settings'} onOpenChange={handleMenuOpenChange('settings')}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip="Settings" isActive={isSettingsActive}>
                                                    <Settings />
                                                    <span className="sidebar-shown">Settings</span>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterLinks(settingsLinks).map((link) => (
                                                    <SidebarMenuItem key={link.href}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                                            <Link href={link.href}>
                                                                <link.icon />
                                                                <span className="sidebar-shown">{link.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {bottomLinks.map((link) => (
                                    <SidebarMenuItem key={link.href}>
                                        <SidebarMenuButton asChild tooltip={link.label} isActive={pathname.startsWith(link.href)}>
                                            <Link href={link.href}>
                                                <link.icon />
                                                <span className="sidebar-shown">{link.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </div>
                    </SidebarContent>
                </div>
                <SidebarFooter>
                    <div className="flex items-center justify-end gap-2 p-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 sidebar-shown" onClick={toggleSidebar}>
                            <MenuToggleIcon />
                        </Button>
                    </div>
                </SidebarFooter>
            </div>
        </Sidebar>
    )
}

function PageContent({ children }: { children: React.ReactNode }) {
    const { setIsLoading } = useLoading();
    const pathname = usePathname();

    useEffect(() => {
        setIsLoading(false);
    }, [pathname, setIsLoading]);

    useEffect(() => {
        const handleAnchorClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const anchor = target.closest('a');
            if (anchor && anchor.href && anchor.target !== '_blank') {
                const currentUrl = new URL(window.location.href);
                const nextUrl = new URL(anchor.href);
                if (currentUrl.origin === nextUrl.origin && currentUrl.pathname !== nextUrl.pathname) {
                    setIsLoading(true);
                }
            }
        };

        document.addEventListener('click', handleAnchorClick);
        return () => document.removeEventListener('click', handleAnchorClick);
    }, [setIsLoading]);

    return <Suspense fallback={<LoadingIndicator />}>{children}</Suspense>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { companyInfo, loading: companyLoading } = useCompany();
    const { isLoading } = useLoading();
    const pathname = usePathname();

    const isHelpPage = pathname === '/help';

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || companyLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <LoadingIndicator />
            </div>
        )
    }

    return (
        <>
            <link rel="stylesheet" href="/items/labels/print.css" media="print" />
            <HoldProvider>
                <SidebarProvider>
                    {isLoading && <LoadingIndicator />}
                    {!isHelpPage && <AppSidebar />}
                    <SidebarInset>
                        {!isHelpPage && <AppHeader />}
                        <main className={!isHelpPage ? "flex-1 p-6 md:p-8 bg-slate-50/40" : ""}>
                            <PageContent>{children}</PageContent>
                        </main>
                        {!isHelpPage && <footer className="flex items-center justify-between p-4 border-t bg-background text-xs text-muted-foreground print:hidden">
                            <div className="flex items-center gap-2">
                                <MbPosLogo className="h-5 w-5 text-primary" />
                                <span>&copy; {new Date().getFullYear()} {companyInfo?.name}. All Rights Reserved.</span>
                            </div>
                            <span>Version: {companyInfo?.version || '1.0'}</span>
                        </footer>}
                    </SidebarInset>
                </SidebarProvider>
            </HoldProvider>
        </>
    );
}

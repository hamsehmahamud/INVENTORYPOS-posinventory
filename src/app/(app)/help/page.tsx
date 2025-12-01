
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, ChevronsRight, Menu } from 'lucide-react';

const placeholderImages = require('@/app/lib/placeholder-images.json');

const tableOfContents = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'installation', label: 'Installation' },
  { id: 'login', label: 'Login' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'items', label: 'Items Management' },
  { id: 'sales', label: 'Sales & POS' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'reports', label: 'Reports' },
  { id: 'users', label: 'User Management' },
  { id: 'settings', label: 'Settings' },
];

const Scrollspy = ({ items, onSectionChange }: { items: typeof tableOfContents, onSectionChange: (id: string) => void }) => {
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    onSectionChange(entry.target.id);
                }
            });
        }, { rootMargin: "-50% 0px -50% 0px" });

        itemRefs.current = Array.from(document.querySelectorAll('.docs-section'));
        itemRefs.current.forEach(item => {
            if (item) observer.observe(item);
        });

        return () => {
            itemRefs.current.forEach(item => {
                if (item) observer.unobserve(item);
            });
        };
    }, [items, onSectionChange]);

    return null;
};

export default function HelpDocumentationPage() {
    const [activeSection, setActiveSection] = useState('introduction');
    const [isTocOpen, setIsTocOpen] = useState(false);
    
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
            setIsTocOpen(false);
        }
    };

    return (
        <div className="relative">
             <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center fixed top-20 left-[var(--sidebar-width-icon)] right-0 z-20 print:hidden md:left-[var(--sidebar-width-icon)] group-data-[state=expanded]:md:left-[var(--sidebar-width)] transition-all">
                <h1 className="text-xl font-bold">Maareye Inventory POS - Help Documentation</h1>
                 <Button variant="ghost" className="md:hidden" onClick={() => setIsTocOpen(!isTocOpen)}>
                    <Menu />
                </Button>
            </div>
            
            <div className="flex flex-col md:flex-row pt-16">
                 {/* Mobile TOC */}
                <div className={`fixed top-36 left-0 w-64 bg-background border-r p-4 z-30 transition-transform transform ${isTocOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
                     <h3 className="font-semibold mb-4">TABLE OF CONTENTS</h3>
                    <nav>
                        <ul>
                            {tableOfContents.map(item => (
                                <li key={item.id} className="mb-2">
                                    <button
                                        onClick={() => scrollToSection(item.id)}
                                        className={`w-full text-left text-sm hover:text-primary ${activeSection === item.id ? 'text-primary font-bold' : ''}`}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                 {isTocOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsTocOpen(false)}></div>}

                {/* Desktop TOC */}
                <aside className="hidden md:block w-64 flex-shrink-0 p-8 sticky top-36 h-[calc(100vh-9rem)] overflow-y-auto print:hidden">
                    <h3 className="font-semibold mb-4 text-muted-foreground">TABLE OF CONTENTS</h3>
                    <nav>
                        <ul>
                            {tableOfContents.map(item => (
                                <li key={item.id} className="mb-2">
                                    <button
                                        onClick={() => scrollToSection(item.id)}
                                        className={`w-full text-left text-sm hover:text-primary ${activeSection === item.id ? 'text-primary font-bold' : ''}`}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                     <Scrollspy items={tableOfContents} onSectionChange={setActiveSection} />
                    <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Home className="h-4 w-4"/>
                            <ChevronsRight className="h-4 w-4" />
                            <span>Documentation</span>
                        </div>
                        <div className="text-right">
                           <p><strong>Created by:</strong> Hamse M Ismail</p>
                           <p><strong>Year:</strong> 2025</p>
                           <p><strong>Email:</strong> hamsehmahamud@gmail.com</p>
                        </div>
                    </div>
                    
                    <Card className="shadow-lg">
                        <CardContent className="p-6 md:p-10 space-y-12">
                             <div className="prose max-w-none">
                                <div id="introduction" className="docs-section scroll-mt-24">
                                    <h2>Introduction</h2>
                                    <p>Maareye Inventory POS is a comprehensive, modern web application built with Next.js and Firebase. It provides a full-featured Point of Sale (POS), inventory management, accounting, and warehousing system. You can track and manage items, stock levels, suppliers, customers, categories, sales invoices, purchase invoices, users, and generate all the reports required for your office.</p>
                                    <p>Thank you for using our product. If you have any questions beyond this help file, please email us at <a href="mailto:hamsehmahamud@gmail.com">hamsehmahamud@gmail.com</a>.</p>
                                </div>
                                
                                <div id="installation" className="docs-section scroll-mt-24">
                                    <h2>Installation Process</h2>
                                    <h3>Minimum System Requirements</h3>
                                    <ul>
                                        <li>Node.js v18 or higher</li>
                                        <li>A modern web browser (Chrome, Firefox, Safari, Edge)</li>
                                        <li>An internet connection for Firebase services</li>
                                    </ul>
                                    <h3>Local Server Installation</h3>
                                    <p>To run this application on your local machine for development, follow these steps:</p>
                                    <ol>
                                        <li>Clone the project repository from your source control.</li>
                                        <li>Open a terminal in the project directory.</li>
                                        <li>Run <code>npm install</code> to install all dependencies.</li>
                                        <li>Run <code>npm run dev</code> to start the development server.</li>
                                        <li>Open your browser and navigate to <code>http://localhost:3000</code>. The application will connect to a live Firebase backend for data storage.</li>
                                    </ol>
                                </div>

                                <div id="login" className="docs-section scroll-mt-24">
                                    <h2>Login</h2>
                                    <p>To access the system, you must log in with your credentials. A default admin account is created with email <code>admin@example.com</code> and password <code>123456</code>. You must also select the correct role associated with your account to proceed.</p>
                                     <Image src={placeholderImages.login.src} alt="Login Screenshot" width={500} height={400} className="rounded-md border my-4" data-ai-hint={placeholderImages.login['data-ai-hint']}/>
                                </div>

                                <div id="dashboard" className="docs-section scroll-mt-24">
                                    <h2>Dashboard</h2>
                                    <p>The dashboard provides a high-level overview of your business operations. It displays key performance indicators (KPIs) such as Total Sales, Total Purchases, due amounts, and expenses. You can filter the data by daily, weekly, monthly, or yearly views. Additionally, it features charts for visualizing sales vs. purchase trends and lists for recently added items, expired items, and stock alerts.</p>
                                     <Image src={placeholderImages.dashboard.src} alt="Dashboard Screenshot" width={800} height={450} className="rounded-md border my-4" data-ai-hint={placeholderImages.dashboard['data-ai-hint']}/>
                                </div>
                                
                                <div id="items" className="docs-section scroll-mt-24">
                                    <h2>Items Management</h2>
                                    <p>Manage your products from the "Items" menu. You can add new items with details like price, quantity, and SKU, or manage existing ones. The system also supports bulk import of items from a CSV file via "Import Items" and lets you manage item categories and brands.</p>
                                    <Image src={placeholderImages.newItem.src} alt="New Item Screenshot" width={800} height={550} className="rounded-md border my-4" data-ai-hint={placeholderImages.newItem['data-ai-hint']}/>
                                    <Image src={placeholderImages.itemsList.src} alt="Items List Screenshot" width={800} height={450} className="rounded-md border my-4" data-ai-hint={placeholderImages.itemsList['data-ai-hint']}/>
                                    <Image src={placeholderImages.importItems.src} alt="Import Items Screenshot" width={800} height={550} className="rounded-md border my-4" data-ai-hint={placeholderImages.importItems['data-ai-hint']}/>
                                </div>
                                 
                                <div id="sales" className="docs-section scroll-mt-24">
                                    <h2>Sales & POS</h2>
                                    <p>The "Sales" menu contains the Point of Sale (POS) interface for quick and easy sales processing. You can select items, manage quantities, hold orders, and process payments through various methods. The "Sales List" page allows you to view and manage past sales invoices and returns.</p>
                                    <Image src={placeholderImages.pos.src} alt="POS Screenshot" width={800} height={450} className="rounded-md border my-4" data-ai-hint={placeholderImages.pos['data-ai-hint']}/>
                                    <Image src={placeholderImages.salesList.src} alt="Sales List Screenshot" width={800} height={450} className="rounded-md border my-4" data-ai-hint={placeholderImages.salesList['data-ai-hint']}/>
                                </div>

                                <div id="purchases" className="docs-section scroll-mt-24">
                                    <h2>Purchases</h2>
                                    <p>Track all your purchase orders and returns from the "Purchase" menu. You can create new purchase orders, add items from your database, and manage payment statuses. The system helps you maintain accurate records of items received from suppliers to keep inventory and accounts payable up to date.</p>
                                    <Image src={placeholderImages.newPurchase.src} alt="New Purchase Screenshot" width={800} height={550} className="rounded-md border my-4" data-ai-hint={placeholderImages.newPurchase['data-ai-hint']}/>
                                    <Image src={placeholderImages.purchasesList.src} alt="Purchases List Screenshot" width={800} height={450} className="rounded-md border my-4" data-ai-hint={placeholderImages.purchasesList['data-ai-hint']}/>
                                </div>

                                <div id="customers" className="docs-section scroll-mt-24">
                                    <h2>Customers</h2>
                                    <p>Under the "Customers" menu, you can manage your customer database. This includes adding new customers, importing them in bulk via CSV, editing their profiles, and viewing detailed statements that show all their sales and payment transactions.</p>
                                    <Image src={placeholderImages.customerList.src} alt="Customer List Screenshot" width={800} height={450} className="rounded-md border my-4" data-ai-hint={placeholderImages.customerList['data-ai-hint']}/>
                                    <Image src={placeholderImages.newCustomer.src} alt="New Customer Screenshot" width={800} height={550} className="rounded-md border my-4" data-ai-hint={placeholderImages.newCustomer['data-ai-hint']}/>
                                </div>
                                
                                <div id="suppliers" className="docs-section scroll-mt-24">
                                    <h2>Suppliers</h2>
                                    <p>Maintain a comprehensive list of your suppliers under the "Suppliers" menu. You can add new suppliers with contact details and an initial balance, edit their information, and view a complete transaction history and account statement for each supplier from their details page.</p>
                                    <Image src={placeholderImages.newSupplier.src} alt="New Supplier Screenshot" width={800} height={550} className="rounded-md border my-4" data-ai-hint={placeholderImages.newSupplier['data-ai-hint']}/>
                                </div>
                                
                                <div id="expenses" className="docs-section scroll-mt-24">
                                    <h2>Expenses</h2>
                                    <p>Record and categorize all your business expenses from the "Expenses" menu to get a clear picture of your company's spending. You can create new expense entries, assign them to categories, and view a filterable list of all recorded expenses.</p>
                                    <Image src={placeholderImages.newExpense.src} alt="New Expense Screenshot" width={800} height={550} className="rounded-md border my-4" data-ai-hint={placeholderImages.newExpense['data-ai-hint']}/>
                                </div>

                                <div id="accounting" className="docs-section scroll-mt-24">
                                    <h2>Accounting</h2>
                                    <p>The "Accounting" module helps you manage accounts receivable (customer invoices) and accounts payable (supplier bills). You can track payments received from customers and payments made to suppliers, ensuring your financial records are accurate. You can also generate detailed statements for both customers and suppliers.</p>
                                </div>

                                <div id="reports" className="docs-section scroll-mt-24">
                                    <h2>Reports</h2>
                                    <p>Generate a wide variety of financial and operational reports from the "Reports" menu. This includes Profit & Loss, detailed reports for sales, purchases, stock levels, expenses, and item-specific performance.</p>
                                     <Image src={placeholderImages.reports.src} alt="Reports Screenshot" width={800} height={450} className="rounded-md border my-4" data-ai-hint={placeholderImages.reports['data-ai-hint']}/>
                                </div>

                                <div id="users" className="docs-section scroll-mt-24">
                                    <h2>User Management</h2>
                                    <p>Create and manage user accounts for your staff from the "Users" menu. The system supports role-based access control (RBAC), allowing you to define specific permissions for different user roles (e.g., Admin, Sales Manager) to ensure that users can only access the features relevant to their jobs.</p>
                                </div>
                                
                                <div id="settings" className="docs-section scroll-mt-24">
                                    <h2>Settings</h2>
                                    <p>Customize the application to fit your business needs from the "Settings" menu. You can configure site details (name, logo, address), customize invoice and report formats, manage tax rates, currencies, and payment types. Users can also change their own password and manage their profile from the user menu.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}

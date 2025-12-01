
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
        <div className="relative min-h-screen bg-gray-50/50 font-sans">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Home className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Help Center</h1>
                </div>
                <Button variant="ghost" className="md:hidden" onClick={() => setIsTocOpen(!isTocOpen)}>
                    <Menu />
                </Button>
            </div>

            <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
                {/* Mobile TOC */}
                <div className={`fixed top-[65px] left-0 w-64 h-[calc(100vh-65px)] bg-white border-r p-6 z-30 transition-transform transform ${isTocOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden overflow-y-auto shadow-xl`}>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-6">On this page</h3>
                    <nav>
                        <ul className="space-y-1">
                            {tableOfContents.map(item => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollToSection(item.id)}
                                        className={`w-full text-left text-sm py-2 px-3 rounded-md transition-colors ${activeSection === item.id ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                {isTocOpen && <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setIsTocOpen(false)}></div>}

                {/* Desktop TOC */}
                <aside className="hidden md:block w-72 flex-shrink-0 p-8 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto print:hidden border-r bg-white/50 backdrop-blur-sm">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-6">On this page</h3>
                    <nav>
                        <ul className="space-y-1">
                            {tableOfContents.map(item => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollToSection(item.id)}
                                        className={`w-full text-left text-sm py-2 px-3 rounded-md transition-colors ${activeSection === item.id ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' : 'text-gray-600 hover:bg-gray-100 border-l-2 border-transparent'}`}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-12 max-w-5xl">
                    <Scrollspy items={tableOfContents} onSectionChange={setActiveSection} />

                    <div className="mb-10 pb-6 border-b">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Maareye Inventory POS Documentation</h1>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Complete guide to managing your inventory, sales, and business operations efficiently.
                        </p>
                    </div>

                    <div className="space-y-16">
                        <div id="introduction" className="docs-section scroll-mt-28">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">#</span> Introduction
                            </h2>
                            <div className="prose prose-gray max-w-none text-gray-600">
                                <p className="leading-7">Maareye Inventory POS is a comprehensive, modern web application built with Next.js and Firebase. It provides a full-featured Point of Sale (POS), inventory management, accounting, and warehousing system. You can track and manage items, stock levels, suppliers, customers, categories, sales invoices, purchase invoices, users, and generate all the reports required for your office.</p>
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg">
                                    <p className="text-blue-700 text-sm font-medium">Need extra help? Contact our support team at <a href="mailto:hamsehmahamud@gmail.com" className="underline">hamsehmahamud@gmail.com</a>.</p>
                                </div>
                            </div>
                        </div>

                        <div id="installation" className="docs-section scroll-mt-28">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">#</span> Installation
                            </h2>
                            <Card className="bg-slate-900 text-slate-50 border-none shadow-xl overflow-hidden">
                                <CardContent className="p-6 font-mono text-sm">
                                    <div className="flex gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                    </div>
                                    <p className="text-slate-400"># Install dependencies</p>
                                    <p className="mb-4">$ npm install</p>
                                    <p className="text-slate-400"># Start development server</p>
                                    <p>$ npm run dev</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div id="login" className="docs-section scroll-mt-28">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">#</span> Login
                            </h2>
                            <p className="text-gray-600 mb-6 leading-7">To access the system, log in with your credentials. The secure login screen ensures only authorized personnel can access sensitive business data.</p>
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white p-2">
                                <Image src={placeholderImages.login.src} alt="Login Screen" width={800} height={500} className="rounded-lg w-full h-auto object-cover" data-ai-hint={placeholderImages.login['data-ai-hint']} />
                            </div>
                        </div>

                        <div id="dashboard" className="docs-section scroll-mt-28">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">#</span> Dashboard
                            </h2>
                            <p className="text-gray-600 mb-6 leading-7">Your command center. View real-time KPIs, sales trends, and critical alerts immediately upon logging in.</p>
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white p-2">
                                <Image src={placeholderImages.dashboard.src} alt="Dashboard" width={1000} height={600} className="rounded-lg w-full h-auto object-cover" data-ai-hint={placeholderImages.dashboard['data-ai-hint']} />
                            </div>
                        </div>

                        <div id="items" className="docs-section scroll-mt-28">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">#</span> Items Management
                            </h2>
                            <p className="text-gray-600 mb-6 leading-7">Efficiently manage your product catalog. Add, edit, and organize items with ease.</p>
                            <div className="grid grid-cols-1 gap-8">
                                <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200 bg-white p-2">
                                    <Image src={placeholderImages.itemsList.src} alt="Items List" width={1000} height={600} className="rounded-lg w-full h-auto object-cover" data-ai-hint={placeholderImages.itemsList['data-ai-hint']} />
                                    <p className="text-center text-sm text-gray-500 mt-2 py-2">Comprehensive items list view</p>
                                </div>
                            </div>
                        </div>

                        <div id="sales" className="docs-section scroll-mt-28">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">#</span> Sales & POS
                            </h2>
                            <p className="text-gray-600 mb-6 leading-7">Process transactions quickly with our intuitive POS interface designed for speed and accuracy.</p>
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white p-2">
                                <Image src={placeholderImages.pos.src} alt="POS Interface" width={1000} height={600} className="rounded-lg w-full h-auto object-cover" data-ai-hint={placeholderImages.pos['data-ai-hint']} />
                            </div>
                        </div>

                        <div id="purchases" className="docs-section scroll-mt-28">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">#</span> Purchases
                            </h2>
                            <p className="text-gray-600 mb-6 leading-7">Keep track of your stock replenishment and supplier orders.</p>
                        </div>

                        <div id="reports" className="docs-section scroll-mt-28">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">#</span> Reports
                            </h2>
                            <p className="text-gray-600 mb-6 leading-7">Gain insights into your business performance with detailed financial and operational reports.</p>
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white p-2">
                                <Image src={placeholderImages.reports.src} alt="Reports" width={1000} height={600} className="rounded-lg w-full h-auto object-cover" data-ai-hint={placeholderImages.reports['data-ai-hint']} />
                            </div>
                        </div>

                        {/* Other sections can be added similarly */}
                        <div className="p-8 bg-gray-100 rounded-xl text-center mt-12">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Still have questions?</h3>
                            <p className="text-gray-600 mb-4">Our support team is always ready to help you.</p>
                            <Button className="bg-primary text-white hover:bg-primary/90">Contact Support</Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

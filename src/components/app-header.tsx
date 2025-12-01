

"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Globe, User, Moon, Sun, Laptop, Maximize, Minimize, PlusCircle, Calculator, Settings, Hand, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useHold } from "@/context/hold-context";
import { Badge } from "./ui/badge";

const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pos", label: "Point of Sale" },
    { href: "/items", label: "Items" },
    { href: "/sales", label: "Sales" },
    { href: "/people", label: "People" },
    { href: "/reports", label: "Reports" },
    { href: "/pricing-assistant", label: "Pricing Assistant" },
    { href: "/settings", label: "Settings" },
    { href: "/users", label: "Users" },
    { href: "/profile", label: "Profile" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { companyInfo } = useCompany();
  const { heldOrders, loadOrder, deleteOrder } = useHold();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [theme, setTheme] = useState("dark");


  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'system';
    setTheme(storedTheme);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      localStorage.setItem('theme', theme);
    }
  }, [theme]);
  
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };


  const getPageTitle = (path: string) => {
    // Exact matches first
    const exactMatch = navLinks.find(link => link.href === path);
    if (exactMatch) return exactMatch.label;
    
    // Then check for partial matches for nested routes
    const partialMatch = navLinks
      .filter(link => link.href !== '/')
      .find(link => path.startsWith(link.href));
    if (partialMatch) return partialMatch.label;

    return companyInfo?.name || "InvoGenius";
  }

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname, companyInfo]);

  const getInitials = (name?: string | null) => {
      if (!name) return <User />;
      const nameParts = name.split(' ');
      if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
          return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  }

  return (
    <header className={cn("sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6", "print:hidden")}>
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex w-full items-center justify-between">
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        <PlusCircle />
                        <span className="hidden sm:inline-block">Quick Create</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link href="/items/new">New Item</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/sales/new">New Sale</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/purchase/new">New Purchase</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/customers/new">New Customer</Link></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative">
                  <Hand />
                  {heldOrders.length > 0 && (
                    <Badge variant="destructive" className="absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full p-0">
                      {heldOrders.length}
                    </Badge>
                  )}
                  <span className="hidden sm:inline-block">View Holds</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Held Orders</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {heldOrders.length > 0 ? (
                  heldOrders.map((order) => (
                    <DropdownMenuItem key={order.id} className="flex justify-between items-center" onSelect={(e) => e.preventDefault()}>
                      <div onClick={() => loadOrder(order.id)}>
                        <span>{order.customerName}</span>
                        <span className="text-xs text-muted-foreground ml-2">({order.items.length} items)</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteOrder(order.id)}>
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No held orders</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="bg-blue-900 hover:bg-blue-800 text-white" asChild>
                <Link href="/pos">
                    <Calculator />
                    <span className="hidden sm:inline-block">POS</span>
                </Link>
            </Button>
            
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuItem>English</DropdownMenuItem>
              <DropdownMenuItem>Español</DropdownMenuItem>
              <DropdownMenuItem>Français</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
           <Button variant="outline" size="icon" onClick={toggleFullScreen}>
            {isFullScreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle fullscreen</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings/site-settings">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                  <AvatarFallback>
                    {getInitials(user?.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.displayName || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/site-settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

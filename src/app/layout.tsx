
import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import './globals.css';
import './reports.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import { CompanyProvider } from '@/context/company-context';
import { cn } from '@/lib/utils';
import { HoldProvider } from '@/context/hold-context';
import { LoadingProvider } from '@/context/loading-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'InvoGenius',
  description: 'The smart way to manage your inventory and sales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable)} suppressHydrationWarning>
      <body className="font-body antialiased">
        <AuthProvider>
          <CompanyProvider>
            <HoldProvider>
              <LoadingProvider>
                {children}
              </LoadingProvider>
              <Toaster />
            </HoldProvider>
          </CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

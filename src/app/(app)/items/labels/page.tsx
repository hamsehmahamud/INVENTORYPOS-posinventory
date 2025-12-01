
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { getItems, type Item } from '@/services/items';
import QRCode from 'qrcode.react';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/company-context';
import './print.css';

function LabelPrintPreview({ items, currency }: { items: Item[], currency: string }) {
    if (items.length === 0) return null;

    return (
        <div id="print-area" className="hidden print:block">
            <div className="grid grid-cols-3 gap-4 p-4">
                {items.map(item => (
                    <div key={item.id} className="border border-black p-2 flex flex-col items-center text-center break-words">
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs">SKU: {item.sku}</p>
                         {item.sku && <QRCode value={item.sku} size={64} level="L" />}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function PrintLabelsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { companyInfo } = useCompany();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [itemsToPrint, setItemsToPrint] = useState<Item[]>([]);

  const currency = companyInfo?.currencySymbol || '$';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const fetchedItems = await getItems();
        setItems(fetchedItems);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load items.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);
  
   useEffect(() => {
    if (itemsToPrint.length > 0) {
      const timeoutId = setTimeout(() => {
        window.print();
        setItemsToPrint([]); // Clear after triggering print
      }, 100); // Small delay to ensure state update and re-render
      return () => clearTimeout(timeoutId);
    }
  }, [itemsToPrint]);

  const handleSelectItem = (itemId: string, isSelected: boolean) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: isSelected }));
  };
  
  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  
  const handleSelectAll = (select: boolean) => {
    const newSelectedItems: Record<string, boolean> = {};
    if (select) {
        items.forEach(item => {
            newSelectedItems[item.id!] = true;
        });
    }
    setSelectedItems(newSelectedItems);
  }

  const handlePrint = () => {
    const toPrint = items.filter(item => selectedItems[item.id!]);
    if (toPrint.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No items selected',
        description: 'Please select at least one item to print a label for.',
      });
      return;
    }
    setItemsToPrint(toPrint);
  };

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6 print:hidden">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Print Item Labels</h1>
                <p className="text-muted-foreground">Generate and print labels for your items.</p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Items
            </Button>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Label Printing Options</CardTitle>
          <CardDescription>
            Select items and configure label settings for printing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            <div className="grid gap-2">
                <Label>Select Items to Print Labels For: ({selectedCount} selected)</Label>
                <ScrollArea className="h-64 w-full rounded-md border p-4">
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="flex items-center space-x-2">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={`${item.id!}-${index}`} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`item-${item.id!}`} 
                                        checked={!!selectedItems[item.id!]}
                                        onCheckedChange={(checked) => handleSelectItem(item.id!, Boolean(checked))}
                                    />
                                    <Label htmlFor={`item-${item.id!}`} className="font-normal">
                                        {item.sku} - {item.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="flex gap-2 text-sm mt-2">
                    <button onClick={() => handleSelectAll(true)} className="text-primary hover:underline">Select All</button>
                    <span>/</span>
                    <button onClick={() => handleSelectAll(false)} className="text-primary hover:underline">Deselect All</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <Label htmlFor="label-template">Label Template</Label>
                    <Select defaultValue="standard">
                        <SelectTrigger id="label-template">
                        <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="standard">Standard Label</SelectItem>
                        <SelectItem value="price-tag">Price Tag</SelectItem>
                        <SelectItem value="small-barcode">Small Barcode</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="paper-size">Paper Size</Label>
                    <Select defaultValue="a4">
                        <SelectTrigger id="paper-size">
                        <SelectValue placeholder="Select paper size" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="a4">A4 Sheet</SelectItem>
                        <SelectItem value="letter">Letter Sheet</SelectItem>
                        <SelectItem value="thermal-4x6">Thermal Label (4" x 6")</SelectItem>
                        <SelectItem value="thermal-2x1">Thermal Label (2" x 1")</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handlePrint} disabled={selectedCount === 0}>
                <Printer className="mr-2 h-4 w-4" />
                Print Labels ({selectedCount})
            </Button>
        </CardFooter>
      </Card>
    </div>
    <LabelPrintPreview items={itemsToPrint} currency={currency} />
    </>
  );
}

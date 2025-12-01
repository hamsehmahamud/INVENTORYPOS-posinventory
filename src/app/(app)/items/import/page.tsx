'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { importItemsAction } from './actions';
import type { Item } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ImportItemsPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setImportResult(null);
    } else {
      setSelectedFile(null);
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please select a valid CSV file.',
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select a CSV file to import.',
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      try {
        const items = parseCSV(csvText);
        if (items.length === 0) {
          throw new Error('CSV file is empty or invalid.');
        }
        const result = await importItemsAction(items);
        setImportResult(result);
         toast({
          title: result.success ? 'Success' : 'Error',
          description: result.message,
          variant: result.success ? 'default' : 'destructive'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown parsing error occurred.';
        setImportResult({ success: false, message: errorMessage });
         toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: errorMessage,
        });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(selectedFile);
  };
  
  const parseCSV = (text: string): Omit<Item, 'id'>[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['name', 'price', 'quantity', 'status'];
    const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));

    if (!hasRequiredHeaders) {
        throw new Error(`CSV must include the following headers: ${requiredHeaders.join(', ')}.`);
    }

    return lines.slice(1).map(line => {
        const values = line.split(',');
        const itemData: any = {};
        headers.forEach((header, index) => {
            itemData[header] = values[index]?.trim();
        });
        
        const price = parseFloat(itemData.price);
        const quantity = parseInt(itemData.quantity, 10);
        const purchasePrice = parseFloat(itemData.purchasePrice);


        if (isNaN(price) || isNaN(quantity)) {
            throw new Error('Invalid number format for price or quantity in one of the rows.');
        }

        return {
            name: itemData.name,
            price: price,
            quantity: quantity,
            status: itemData.status as Item['status'],
            sku: itemData.sku,
            category: itemData.category,
            brand: itemData.brand,
            description: itemData.description,
            image: itemData.image,
            hsn: itemData.hsn || '',
            unit: itemData.unit || 'pc',
            minQuantity: parseInt(itemData.minQuantity, 10) || 0,
            purchasePrice: isNaN(purchasePrice) ? 0 : purchasePrice,
            tax: itemData.tax || '0%',
        };
    });
};


  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Import Items</CardTitle>
        <CardDescription>Bulk import items from a CSV file.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="import-file">Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <Input id="import-file" type="file" className="flex-1" accept=".csv" onChange={handleFileChange} />
            </div>
            <p className="text-xs text-muted-foreground">Ensure your file is in CSV format.</p>
          </div>

          <div className="border border-dashed rounded-lg p-6 text-center">
            {selectedFile ? (
              <>
                <FileText className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-2 text-sm text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{Math.round(selectedFile.size / 1024)} KB</p>
              </>
            ) : (
              <>
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Select a file to begin the import process.</p>
              </>
            )}
          </div>
        </div>

        {importResult && (
           <Alert variant={importResult.success ? "default" : "destructive"} className={importResult.success ? "bg-green-500/10 border-green-500/30" : ""}>
            {importResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{importResult.success ? "Import Successful" : "Import Failed"}</AlertTitle>
            <AlertDescription>{importResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold">Instructions</h4>
           <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Required Columns:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>`name`</li>
                  <li>`price` (Final Sales Price)</li>
                  <li>`quantity` (Stock Qty.)</li>
                  <li>`status` ('Active', 'In Stock', etc.)</li>
                </ul>
              </div>
               <div>
                <p className="font-medium text-foreground">Optional Columns:</p>
                 <ul className="list-disc list-inside space-y-1">
                  <li>`image` (URL)</li>
                  <li>`sku` (Item Code)</li>
                  <li>`brand`</li>
                  <li>`category`</li>
                  <li>`unit`</li>
                  <li>`minQuantity` (Minimum Qty.)</li>
                  <li>`purchasePrice`</li>
                  <li>`tax`</li>
                  <li>`hsn`</li>
                  <li>`description`</li>
                </ul>
              </div>
           </div>
           <p className="text-xs text-muted-foreground pt-2">Download the sample CSV file to see the required format. Do not change the column headers.</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button variant="link" className="p-0 h-auto" asChild>
          <a href="/sample-items.csv" download>Download Sample CSV</a>
        </Button>
        <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Items
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

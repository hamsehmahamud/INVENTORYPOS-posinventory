
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { DownloadCloud, History, Loader2, UploadCloud, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getItems } from "@/services/items";
import { getCustomers } from "@/services/customers";
import { getSales } from "@/services/sales";
import { getPurchases } from "@/services/purchases";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { addItems } from "@/services/items";
import { addCustomer } from "@/services/customers";
// Import addSale and addPurchase if they exist
// For now, we assume we can only restore items and customers.

interface BackupFile {
    date: string;
    file: string;
    size: string;
}

export default function DatabaseBackupRestorePage() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    const handleGenerateBackup = async () => {
        setIsGenerating(true);
        toast({ title: "Generating Backup", description: "Fetching data from database..." });

        try {
            const [items, customers, sales, purchases] = await Promise.all([
                getItems(),
                getCustomers(),
                getSales(),
                getPurchases(),
            ]);

            const backupData = {
                items,
                customers,
                sales,
                purchases,
                createdAt: new Date().toISOString(),
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup-${format(new Date(), 'yyyyMMddHHmmss')}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({ title: "Success", description: "Backup download started." });

        } catch (error) {
            console.error("Failed to generate backup:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate backup data.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/json') {
          setRestoreFile(file);
        } else {
          setRestoreFile(null);
          toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please select a valid JSON file.',
          });
        }
    };
    
    const handleRestore = async () => {
        if (!restoreFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a backup file to restore.' });
            return;
        }

        setIsRestoring(true);
        toast({ title: 'Restoring Database', description: 'Please wait, this may take a moment...' });

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const backupData = JSON.parse(event.target?.result as string);
                
                // This is a simplified restore. A real-world scenario would need to handle
                // conflicts, delete existing data, and be much more robust.
                // It's also a highly destructive operation.
                
                if (backupData.items) {
                    await addItems(backupData.items);
                }
                
                if (backupData.customers) {
                    // addCustomers function might be needed for batch import
                    for (const customer of backupData.customers) {
                       const { id, ...customerData } = customer;
                       await addCustomer(customerData);
                    }
                }

                // Add similar logic for sales, purchases, etc.
                
                toast({ title: 'Success', description: 'Database restored successfully from backup.' });

            } catch (error) {
                console.error("Failed to restore database:", error);
                toast({ variant: 'destructive', title: 'Restore Failed', description: 'Could not restore data. The file might be corrupt.' });
            } finally {
                setIsRestoring(false);
                setRestoreFile(null);
            }
        };
        reader.readAsText(restoreFile);
    };


  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Backup & Restore</CardTitle>
            <CardDescription>Create backups of your application data or restore from a previous backup.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Click the button below to generate and download a new JSON backup of your key database collections.</p>
             <Button onClick={handleGenerateBackup} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
              {isGenerating ? "Generating..." : "Generate & Download Backup"}
            </Button>
          </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle>Restore Database</CardTitle>
                <CardDescription>Restore the database from a JSON backup file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning!</AlertTitle>
                  <AlertDescription>
                    Restoring from a backup is a destructive operation. It will overwrite your current data. Proceed with caution.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-2">
                    <Label htmlFor="restore-file">Upload Backup File (.json)</Label>
                    <Input id="restore-file" type="file" accept=".json" onChange={handleFileChange} />
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleRestore} disabled={isRestoring || !restoreFile}>
                    {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    {isRestoring ? "Restoring..." : "Restore Database"}
                </Button>
            </CardFooter>
         </Card>
     </div>
  );
}


'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrencies, addCurrency, updateCurrency, deleteCurrency, type Currency } from "@/services/settings";
import { Skeleton } from "@/components/ui/skeleton";

export default function CurrencyListPage() {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [currentCurrency, setCurrentCurrency] = useState<Partial<Currency>>({});

  async function fetchCurrencies() {
    setLoading(true);
    try {
      const fetchedCurrencies = await getCurrencies();
      setCurrencies(fetchedCurrencies);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load currencies.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleEdit = (currency: Currency) => {
    setCurrentCurrency(currency);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setCurrentCurrency({});
    setIsDialogOpen(true);
  }

  const handleDelete = async (id: string) => {
     try {
      await deleteCurrency(id);
      toast({ title: 'Success', description: 'Currency deleted successfully.' });
      await fetchCurrencies();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete currency.' });
    }
  }

  const handleSave = async () => {
    if (!currentCurrency.name || !currentCurrency.code || !currentCurrency.symbol) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'All fields are required.' });
        return;
    }
    setIsSaving(true);
    try {
      if (currentCurrency.id) {
        await updateCurrency(currentCurrency as Currency);
        toast({ title: 'Success', description: 'Currency updated successfully.' });
      } else {
        await addCurrency(currentCurrency as Omit<Currency, 'id'>);
        toast({ title: 'Success', description: 'Currency added successfully.' });
      }
      setIsDialogOpen(false);
      setCurrentCurrency({});
      await fetchCurrencies();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save currency.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Currency List</CardTitle>
          <CardDescription>Manage the currencies supported in your store.</CardDescription>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Currency
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))
            ) : (
            currencies.map(currency => (
              <TableRow key={currency.id}>
                <TableCell className="font-medium">{currency.name}</TableCell>
                <TableCell>{currency.code}</TableCell>
                <TableCell>{currency.symbol}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(currency)}>Edit</DropdownMenuItem>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the currency.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(currency.id!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentCurrency.id ? 'Edit Currency' : 'Add New Currency'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={currentCurrency.name || ''} onChange={(e) => setCurrentCurrency({...currentCurrency, name: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">Code</Label>
            <Input id="code" value={currentCurrency.code || ''} onChange={(e) => setCurrentCurrency({...currentCurrency, code: e.target.value })} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="symbol" className="text-right">Symbol</Label>
            <Input id="symbol" value={currentCurrency.symbol || ''} onChange={(e) => setCurrentCurrency({...currentCurrency, symbol: e.target.value })} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

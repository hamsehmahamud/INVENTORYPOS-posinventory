
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/company-context';

interface ReturnItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  reason: string;
  total: number;
}

export default function NewPurchaseReturnPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { companyInfo } = useCompany();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [returnedItems, setReturnedItems] = useState<ReturnItem[]>([]);

    const currency = companyInfo?.currencySymbol || '$';
    const totalRefundAmount = returnedItems.reduce((acc, item) => acc + item.total, 0);

    const handleAddItem = () => {
        setReturnedItems([
            ...returnedItems,
            { id: `item-${Date.now()}`, name: '', quantity: 1, unitCost: 0, reason: '', total: 0 }
        ]);
    };

    const handleItemChange = (id: string, field: keyof ReturnItem, value: any) => {
        setReturnedItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'quantity' || field === 'unitCost') {
                        updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unitCost || 0);
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };

    const handleCreateReturn = () => {
        toast({
            title: "Functionality Pending",
            description: "Creating the purchase return is not yet implemented.",
        });
    }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Create New Purchase Return</h1>
                <p className="text-muted-foreground">Record items returned to a supplier.</p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Purchase Returns List
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Purchase Return Details</CardTitle>
            <CardDescription>Generating Return ID...</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="original-purchase-id">Original Purchase ID</Label>
                    <Input id="original-purchase-id" placeholder="e.g., PO-001" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="return-date">Return Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="return-date"
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

             <div className="grid gap-2">
                <Label htmlFor="supplier-name">Supplier Name</Label>
                <Input id="supplier-name" placeholder="e.g., Global Supplies Inc." />
                <p className="text-xs text-muted-foreground">Enter supplier name or it might auto-fill if original Purchase ID is processed.</p>
            </div>

            <div>
                <h3 className="text-lg font-medium mb-2">Returned Items</h3>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[35%]">Item Name</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Unit Cost ({currency})</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right">Total ({currency})</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returnedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No items added yet.</TableCell>
                                </TableRow>
                            ) : (
                                returnedItems.map(item => (
                                     <TableRow key={item.id}>
                                        <TableCell><Input value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} /></TableCell>
                                        <TableCell><Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} /></TableCell>
                                        <TableCell><Input type="number" value={item.unitCost} onChange={e => handleItemChange(item.id, 'unitCost', parseFloat(e.target.value) || 0)} /></TableCell>
                                        <TableCell><Input value={item.reason} onChange={e => handleItemChange(item.id, 'reason', e.target.value)} placeholder="e.g., Defective" /></TableCell>
                                        <TableCell className="text-right font-medium">{currency}{item.total.toFixed(2)}</TableCell>
                                     </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <Button variant="outline" size="sm" className="mt-2" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="grid gap-2">
                    <Label htmlFor="refund-method">Debit Note Method</Label>
                    <Select>
                        <SelectTrigger id="refund-method"><SelectValue placeholder="Select method" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash-refund">Cash Refund</SelectItem>
                            <SelectItem value="account-credit">Account Credit</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                     <Select>
                        <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="total-refund">Total Debit Amount ({currency})</Label>
                    <Input id="total-refund" readOnly value={`${currency}${totalRefundAmount.toFixed(2)}`} className="font-bold text-lg h-10" />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" placeholder="Any additional notes..." />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={handleCreateReturn}>Create Return</Button>
        </div>
    </div>
  );
}

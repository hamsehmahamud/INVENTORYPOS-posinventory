
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Save, Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getExpenseCategories, addExpense, type ExpenseCategory } from '@/services/expenses';
import { useAuth } from '@/context/auth-context';

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
  const [expenseCategory, setExpenseCategory] = useState<string>('');
  const [referenceNo, setReferenceNo] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function fetchCategories() {
      try {
        const fetchedCategories = await getExpenseCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load expense categories.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [toast]);

  const handleSave = async () => {
    if (!expenseDate || !expenseCategory || !amount) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields: Date, Category, and Amount.',
      });
      return;
    }
    setIsSaving(true);
    try {
      await addExpense({
        date: expenseDate.toISOString(),
        category: expenseCategory,
        referenceNo: referenceNo || `EXP-${Date.now()}`,
        amount: Number(amount),
        notes,
        createdBy: user?.displayName || 'Admin',
      });
      toast({
        title: 'Success',
        description: 'Expense recorded successfully.',
      });
      router.push('/expenses');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save the expense. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>New Expense</CardTitle>
        <CardDescription>Record a new business expense.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="expense-date">Expense Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="expense-date"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !expenseDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expenseDate ? format(expenseDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={expenseDate} onSelect={setExpenseDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expense-category">Expense Category *</Label>
            <div className="flex gap-2">
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((cat) => (
                    <SelectItem key={cat.id!} value={cat.name}>
                        {cat.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => router.push('/expenses/categories')}>
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
                <Label htmlFor="reference-no">Reference No.</Label>
                <Input
                id="reference-no"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g., INV-123, Receipt-456"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                />
            </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details about the expense..."
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Expense
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

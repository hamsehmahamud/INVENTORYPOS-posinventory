
'use client';

import { useEffect, useState } from 'react';
import { getCategories, addCategory, type Category } from '@/services/items';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, Loader2, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function CategoriesListPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  async function fetchCategories() {
    try {
      setLoading(true);
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load categories.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Category name is required.',
      });
      return;
    }
    setIsSaving(true);
    try {
      await addCategory({
        name: newCategoryName,
        description: newCategoryDescription,
      });
      toast({
        title: 'Success',
        description: 'Category added successfully.',
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      await fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Failed to add category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add category.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = (action: string, categoryId: string) => {
    toast({
        title: "Action Not Implemented",
        description: `${action} action for category ${categoryId} is not yet implemented.`
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Existing Categories</CardTitle>
            <CardDescription>List of all item categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAction('Edit', category.id!)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                             <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleAction('Delete', category.id!)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Add New Item Category</CardTitle>
            <CardDescription>Create a new category for items.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Lubricants"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Textarea
                id="category-description"
                placeholder="Brief description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddCategory} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                 <PlusCircle className="mr-2 h-4 w-4" />
                 Add Category
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

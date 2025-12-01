
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addCountry } from '@/services/places';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function NewCountryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [countryName, setCountryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!countryName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Country name is required.',
      });
      return;
    }
    setIsSaving(true);
    try {
      await addCountry({ name: countryName });
      toast({
        title: 'Success',
        description: 'Country added successfully.',
      });
      router.push('/places/countries');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add country.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Country</CardTitle>
        <CardDescription>Create a new country for your records.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <Label htmlFor="country-name">Country Name</Label>
          <Input
            id="country-name"
            value={countryName}
            onChange={(e) => setCountryName(e.target.value)}
            placeholder="e.g., Canada"
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
            'Save Country'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

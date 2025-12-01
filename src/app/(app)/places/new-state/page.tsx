
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addState, getCountries, type Country } from '@/services/places';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function NewStatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stateName, setStateName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const fetchedCountries = await getCountries();
        setCountries(fetchedCountries);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load countries.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchCountries();
  }, [toast]);

  const handleSave = async () => {
    if (!stateName || !selectedCountry) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'State name and country are required.',
      });
      return;
    }
    setIsSaving(true);
    try {
      await addState({ name: stateName, countryId: selectedCountry });
      toast({
        title: 'Success',
        description: 'State added successfully.',
      });
      router.push('/places/states');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add state.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Add New State</CardTitle>
        <CardDescription>Create a new state for your records.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="country">Country</Label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={loading}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country.id!} value={country.id!}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state-name">State Name</Label>
          <Input
            id="state-name"
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            placeholder="e.g., California"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || loading}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save State'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

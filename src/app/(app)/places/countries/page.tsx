
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getCountries, type Country } from '@/services/places';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MoreHorizontal, ChevronDown, Search } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

export default function CountriesListPage() {
  const { toast } = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesToShow, setEntriesToShow] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoading(true);
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

  const filteredCountries = useMemo(() => {
    return countries
        .filter(country => country.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, entriesToShow);
  }, [countries, searchTerm, entriesToShow]);

  const handleAction = (action: string, countryId: string) => {
    toast({
      title: 'Action Not Implemented',
      description: `${action} action for country ${countryId} is not yet implemented.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Countries List</CardTitle>
          <Button asChild>
            <Link href="/places/new-country">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Country
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <label className="text-sm">Show</label>
                <Select value={String(entriesToShow)} onValueChange={(v) => setEntriesToShow(Number(v))}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm">entries</span>
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="search" className="text-sm">Search:</Label>
                <Input 
                    id="search"
                    className="w-48 h-9"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <Table>
          <TableHeader className="bg-primary/80 text-primary-foreground">
            <TableRow>
              <TableHead className="text-white">Country Name</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-9 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              filteredCountries.map((country) => (
                <TableRow key={country.id}>
                  <TableCell className="font-medium">{country.name}</TableCell>
                   <TableCell>
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/20">{country.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="flex items-center gap-1">
                          <span>Action</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleAction('Edit', country.id!)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleAction('Delete', country.id!)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
            Showing 1 to {filteredCountries.length} of {countries.length} entries
        </div>
         <Pagination>
            <PaginationContent>
                <PaginationItem>
                <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                <PaginationNext href="#" />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}

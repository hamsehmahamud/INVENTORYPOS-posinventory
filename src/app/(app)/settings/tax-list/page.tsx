
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function TaxListPage() {
  const taxes = [
    { name: "GST", rate: "18.00%", type: "Exclusive" },
    { name: "VAT", rate: "5.00%", type: "Inclusive" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tax List</CardTitle>
          <CardDescription>Manage tax rates for your store.</CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Tax
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tax Name</TableHead>
              <TableHead>Rate (%)</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.map(tax => (
              <TableRow key={tax.name}>
                <TableCell className="font-medium">{tax.name}</TableCell>
                <TableCell>{tax.rate}</TableCell>
                <TableCell>{tax.type}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter>
        <p className="text-sm text-muted-foreground">This is a placeholder page. Full functionality for adding and editing taxes can be implemented here.</p>
      </CardFooter>
    </Card>
  );
}

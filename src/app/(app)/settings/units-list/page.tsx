
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function UnitsListPage() {
  const units = [
    { name: "Pieces", shortName: "pcs", allowDecimal: "No" },
    { name: "Kilogram", shortName: "kg", allowDecimal: "Yes" },
    { name: "Box", shortName: "box", allowDecimal: "No" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Units List</CardTitle>
          <CardDescription>Manage measurement units for your items.</CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Unit
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Name</TableHead>
              <TableHead>Short Name</TableHead>
              <TableHead>Allow Decimal</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map(unit => (
              <TableRow key={unit.name}>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>{unit.shortName}</TableCell>
                <TableCell>{unit.allowDecimal}</TableCell>
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
        <p className="text-sm text-muted-foreground">This is a placeholder page. Full functionality for adding and editing units can be implemented here.</p>
      </CardFooter>
    </Card>
  );
}

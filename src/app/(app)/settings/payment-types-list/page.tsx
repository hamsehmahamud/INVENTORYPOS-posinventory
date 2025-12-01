
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function PaymentTypesListPage() {
  const paymentTypes = [
    { name: "Cash", status: "Active" },
    { name: "Credit Card", status: "Active" },
    { name: "Bank Transfer", status: "Inactive" },
    { name: "UPI", status: "Active" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Types List</CardTitle>
          <CardDescription>Manage the payment methods available at checkout.</CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Payment Type
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Type Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentTypes.map(type => (
              <TableRow key={type.name}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell>
                  <Badge variant={type.status === 'Active' ? 'default' : 'secondary'} className={type.status === 'Active' ? 'bg-green-500/20 text-green-700' : ''}>{type.status}</Badge>
                </TableCell>
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
        <p className="text-sm text-muted-foreground">This is a placeholder page. Full functionality for managing payment types can be implemented here.</p>
      </CardFooter>
    </Card>
  );
}

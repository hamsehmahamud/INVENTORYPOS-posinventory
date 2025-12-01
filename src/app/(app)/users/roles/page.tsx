
"use client";

import { MoreHorizontal, PlusCircle, ShieldAlert, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getRoles, addRole, updateRole, deleteRole, type Role } from "@/services/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";


const permissions = [
    // Users
    { id: "users-view", label: "View Users" },
    { id: "users-create", label: "Create Users" },
    { id: "users-edit", label: "Edit Users" },
    { id: "users-delete", label: "Delete Users" },
    // Roles
    { id: "roles-view", label: "View Roles" },
    { id: "roles-create", label: "Create Roles" },
    { id: "roles-edit", label: "Edit Roles" },
    { id: "roles-delete", label: "Delete Roles" },
    // Customers
    { id: "customers-view", label: "View Customers" },
    { id: "customers-create", label: "Create Customers" },
    { id: "customers-edit", label: "Edit Customers" },
    { id: "customers-delete", label: "Delete Customers" },
    { id: "customers-import", label: "Import Customers" },
    // Suppliers
    { id: "suppliers-view", label: "View Suppliers" },
    { id: "suppliers-create", label: "Create Suppliers" },
    { id: "suppliers-edit", label: "Edit Suppliers" },
    { id: "suppliers-delete", label: "Delete Suppliers" },
    { id: "suppliers-import", label: "Import Suppliers" },
    // Items
    { id: "items-view", label: "View Items" },
    { id: "items-create", label: "Create Items" },
    { id: "items-edit", label: "Edit Items" },
    { id: "items-delete", label: "Delete Items" },
    { id: "items-import", label: "Import Items" },
    { id: "items-labels", label: "Print Item Labels" },
    // Sales
    { id: "sales-view", label: "View Sales" },
    { id: "sales-create", label: "Create Sales (POS)" },
    { id: "sales-edit", label: "Edit Sales" },
    { id: "sales-delete", label: "Delete Sales" },
    { id: "sales-returns", label: "Manage Sales Returns" },
    // Purchases
    { id: "purchases-view", label: "View Purchases" },
    { id: "purchases-create", label: "Create Purchases" },
    { id: "purchases-edit", label: "Edit Purchases" },
    { id: "purchases-delete", label: "Delete Purchases" },
    { id: "purchases-returns", label: "Manage Purchase Returns" },
     // Expenses
    { id: "expenses-view", label: "View Expenses" },
    { id: "expenses-create", label: "Create Expenses" },
    { id: "expenses-edit", label: "Edit Expenses" },
    { id: "expenses-delete", label: "Delete Expenses" },
    // Accounting
    { id: "accounting-view", label: "View Accounting" },
    { id: "payments-manage", label: "Manage Payments" },
    // Reports
    { id: "reports-view-all", label: "View All Reports" },
    // Settings
    { id: "settings-manage", label: "Manage Settings" },
];


export default function RolesListPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogRole, setDialogRole] = useState<Partial<Role>>({});


  async function fetchRoles() {
    setLoading(true);
    try {
        const fetchedRoles = await getRoles();
        setRoles(fetchedRoles);
        if (fetchedRoles.length > 0) {
            const roleToSelect = selectedRole ? fetchedRoles.find(r => r.id === selectedRole.id) || fetchedRoles[0] : fetchedRoles[0];
            setSelectedRole(roleToSelect);
        } else {
            setSelectedRole(null);
        }
    } catch (error) {
        console.error("Failed to fetch roles:", error);
    } finally {
        setLoading(false);
    }
  }


  useEffect(() => {
    fetchRoles();
  }, []);
  
  useEffect(() => {
    if (selectedRole) {
        setCurrentPermissions(selectedRole.permissions || []);
    } else {
        setCurrentPermissions([]);
    }
  }, [selectedRole]);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setCurrentPermissions(prev => {
        const newPermissions = checked
            ? [...prev, permissionId]
            : prev.filter(p => p !== permissionId);
        return newPermissions;
    });
  }
  
  const handleSelectAll = (checked: boolean) => {
    const newPermissions = checked ? permissions.map(p => p.id) : [];
    setCurrentPermissions(newPermissions);
  }
  
  const handleSaveRole = async () => {
    if (!dialogRole.name) {
        toast({ variant: 'destructive', title: 'Error', description: 'Role name is required.' });
        return;
    }
    setIsSaving(true);
    try {
        if(dialogRole.id) { // Editing existing role
            await updateRole(dialogRole as Role);
            toast({ title: 'Success', description: 'Role updated successfully.' });
        } else { // Adding new role
            await addRole({ name: dialogRole.name, description: dialogRole.description || '', permissions: [] });
            toast({ title: 'Success', description: 'Role added successfully.' });
        }
        await fetchRoles();
        setIsDialogOpen(false);
        setDialogRole({});
    } catch(err) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save role.' });
    } finally {
        setIsSaving(false);
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
        await deleteRole(roleId);
        toast({ title: "Success", description: "Role deleted successfully." });
        if (selectedRole?.id === roleId) {
            setSelectedRole(null);
        }
        await fetchRoles();
    } catch (error) {
         toast({ variant: "destructive", title: "Error", description: "Failed to delete role." });
    }
  }

  const openDialog = (role?: Role) => {
    setDialogRole(role || {});
    setIsDialogOpen(true);
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSavingPermissions(true);
    try {
        await updateRole({
            ...selectedRole,
            permissions: currentPermissions,
        });
        toast({ title: 'Success', description: 'Permissions saved successfully.' });
        await fetchRoles();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save permissions.' });
    } finally {
        setIsSavingPermissions(false);
    }
  };

  const allSelected = permissions.length > 0 && currentPermissions.length === permissions.length;

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                Manage user roles and their permissions.
              </CardDescription>
            </div>
            <Button size="sm" className="h-8 gap-1" onClick={() => openDialog()}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Role
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                roles.map((role) => (
                  <TableRow 
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`cursor-pointer ${selectedRole?.id === role.id ? 'bg-muted' : ''}`}
                  >
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openDialog(role)}>Edit</DropdownMenuItem>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the role "{role.name}".</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteRole(role.id!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-primary" />
                <CardTitle>
                  Role Permissions: {loading ? <Skeleton className="h-6 w-24 inline-block" /> : selectedRole?.name || 'Select a Role'}
                </CardTitle>
            </div>
          <CardDescription>
            Select the permissions for the chosen role.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="flex items-center space-x-2">
                <Checkbox id="select-all" onCheckedChange={handleSelectAll} checked={allSelected} disabled={loading || !selectedRole} />
                 <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                    Select All
                </label>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
                {permissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={permission.id} 
                            disabled={loading || !selectedRole} 
                            checked={currentPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => handlePermissionChange(permission.id, Boolean(checked))}
                        />
                        <label
                        htmlFor={permission.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        {permission.label}
                        </label>
                    </div>
                ))}
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSavePermissions} disabled={loading || !selectedRole || isSavingPermissions}>
                {isSavingPermissions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Permissions
            </Button>
        </CardFooter>
      </Card>
    </div>
    
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{dialogRole.id ? 'Edit Role' : 'Add New Role'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role-name" className="text-right">Role Name</Label>
                    <Input id="role-name" className="col-span-3" value={dialogRole.name || ''} onChange={e => setDialogRole({...dialogRole, name: e.target.value})} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role-desc" className="text-right">Description</Label>
                    <Textarea id="role-desc" className="col-span-3" value={dialogRole.description || ''} onChange={e => setDialogRole({...dialogRole, description: e.target.value})} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveRole} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Save
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

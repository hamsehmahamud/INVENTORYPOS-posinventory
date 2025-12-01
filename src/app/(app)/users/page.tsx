
"use client";

import { MoreHorizontal, PlusCircle, FileDown, Search, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUsers, type User, deleteUser } from "@/services/users";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export default function UsersListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useAuth();

  const isAdmin = userProfile?.role === 'Admin';


  async function fetchUsers() {
      try {
        setLoading(true);
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
         toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user data.' });
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
        await deleteUser(userId);
        toast({ title: "Success", description: "User deleted successfully." });
        await fetchUsers(); // Refresh the list
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
        setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage system users and their roles.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input type="search" placeholder="Search users..." className="pl-8 sm:w-[300px]"/>
            </div>
            {isAdmin && (
              <Button asChild size="sm" className="h-8 gap-1">
                  <Link href="/users/new">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add User
                  </span>
                  </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <FileDown className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export As</DropdownMenuLabel>
                <DropdownMenuItem>CSV</DropdownMenuItem>
                <DropdownMenuItem>Excel</DropdownMenuItem>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>Print</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Sl. No.</TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-center">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  {isAdmin && <TableCell><div className="flex justify-center gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>}
                </TableRow>
              ))
            ) : (
              users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                      <Image
                        alt={user.name}
                        className="aspect-square rounded-md object-cover"
                        height="60"
                        width="60"
                        src="https://placehold.co/60x60.png"
                        data-ai-hint="user avatar"
                        />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}
                      className={user.status === 'Active' ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-red-500/20 text-red-500 border-red-500/20'}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex justify-center gap-2">
                           <Button aria-haspopup="true" size="icon" variant="outline" className="h-8 w-8" onClick={() => router.push(`/users/${user.id}/edit`)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button aria-haspopup="true" size="icon" variant="outline" className="h-8 w-8" onClick={() => router.push(`/users/${user.id}/edit`)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="destructive" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this user account.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id!)} disabled={isDeleting}>
                                      {isDeleting ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-{users.length}</strong> of <strong>{users.length}</strong> users
        </div>
      </CardFooter>
    </Card>
  );
}

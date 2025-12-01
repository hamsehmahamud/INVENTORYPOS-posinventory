
"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import Image from "next/image";

export default function ProfilePage() {
  const { user, userProfile, loading, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoURL, setPhotoURL] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);

  const getInitials = (name?: string | null) => {
    if (!name) return <User className="h-8 w-8" />;
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setPhoto(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;
    
    setIsSaving(true);
    let newPhotoURL = user.photoURL;

    try {
      if (photo) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        const snapshot = await uploadBytes(storageRef, photo);
        newPhotoURL = await getDownloadURL(snapshot.ref);
      }

      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: newPhotoURL || "",
      });
      
      // Also update the name in the Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name: displayName
      });

      await refreshUser();

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
      setPhoto(null);
    }
  };
  
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser || !currentPassword || !newPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all password fields.",
      });
      return;
    }
    
    setIsUpdatingPassword(true);

    try {
      if(user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
        
        toast({
            title: "Success",
            description: "Your password has been updated.",
        });
        setCurrentPassword("");
        setNewPassword("");
      } else {
         throw new Error("User email not found.");
      }

    } catch (error) {
       console.error("Failed to update password:", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
      });
    } finally {
        setIsUpdatingPassword(false);
    }
  }


  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 max-w-2xl mx-auto">
      <form onSubmit={handleSaveChanges}>
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              Update your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={photoURL || undefined}
                  alt={user?.displayName || "User"}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(user?.displayName)}
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={handleUploadClick}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
               <Input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user?.email || ""} disabled />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <form onSubmit={handleChangePassword}>
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              For security, you should choose a strong password.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password" 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
               />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

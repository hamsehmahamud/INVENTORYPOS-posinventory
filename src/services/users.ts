
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, deleteUser as deleteAuthUser } from "firebase/auth";

export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  password?: string; // Should not be stored in Firestore but needed for creation
  firstName?: string; // Not stored, used for creation
  lastName?: string; // Not stored, used for creation
}

export interface Role {
    id?: string;
    name: string;
    description: string;
    permissions?: string[];
}

// Function to create a new user in Firebase Auth and Firestore
export async function createUser(userData: User): Promise<string> {
  if (!userData.email || !userData.password) {
      throw new Error("Email and password are required to create a user.");
  }

  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;

    // Update user profile in Firebase Auth
    await updateProfile(user, {
      displayName: userData.name,
    });
    
    // Don't store sensitive info in Firestore
    const { password, firstName, lastName, ...userDataToStore } = userData;

    // Store additional user details in Firestore, using the UID from Auth as the document ID
    await setDoc(doc(db, "users", user.uid), userDataToStore);

    return user.uid;
  } catch (e) {
    console.error("Error creating user: ", e);
    // Let's provide a more specific error message if possible
    if (e instanceof Error && 'code' in e) {
        const errorCode = (e as {code: string}).code;
        if (errorCode === 'auth/email-already-in-use') {
            throw new Error("This email address is already in use by another account.");
        }
    }
    throw new Error("Could not create user. Please check the details and try again.");
  }
}

// Function to get all users from Firestore
export async function getUsers(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      // The doc.id will now be the Firebase Auth UID
      users.push({ id: doc.id, ...doc.data() } as User);
    });

    return users;
  } catch (e) {
    console.error("Error getting documents: ", e);
    throw new Error("Could not fetch users");
  }
}

// Function to get a single user by ID
export async function getUserById(id: string): Promise<User | null> {
    try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() } as User;
        }
        return null;
    } catch(error) {
        console.error("Error fetching user by id:", error);
        throw new Error("Could not fetch user data.");
    }
}

// Function to update a user in Firestore
export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'email' | 'password'>>): Promise<void> {
    try {
        const userRef = doc(db, "users", id);
        await setDoc(userRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating user: ", error);
        throw new Error("Could not update user information.");
    }
}

// Function to delete a user from Firestore and Auth
// This is a placeholder as deleting from Auth is a protected action,
// but we'll delete from Firestore.
export async function deleteUser(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "users", id));
        // In a real backend scenario, you would call an admin SDK to delete the user from Firebase Auth.
        // For this client-side simulation, we just delete the Firestore record.
        // The user will no longer appear in the app list but will still exist in Firebase Auth.
    } catch (error) {
        console.error("Error deleting user from Firestore: ", error);
        throw new Error("Could not delete user from database.");
    }
}

// Function to get all roles from Firestore
export async function getRoles(): Promise<Role[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "roles"));
    const roles: Role[] = [];
    querySnapshot.forEach((doc) => {
      roles.push({ id: doc.id, ...doc.data() } as Role);
    });

    return roles;
  } catch (e) {
    console.error("Error getting documents: ", e);
    throw new Error("Could not fetch roles");
  }
}

// Function to add a new role
export async function addRole(roleData: Omit<Role, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "roles"), roleData);
        return docRef.id;
    } catch (e) {
        console.error("Error adding role: ", e);
        throw new Error("Could not add new role.");
    }
}

// Function to update an existing role
export async function updateRole(roleData: Role): Promise<void> {
    if (!roleData.id) {
        throw new Error("Role ID is missing. Cannot update.");
    }
    try {
        const roleRef = doc(db, "roles", roleData.id);
        const { id, ...dataToUpdate } = roleData;
        await setDoc(roleRef, dataToUpdate, { merge: true });
    } catch (e) {
        console.error("Error updating role: ", e);
        throw new Error("Could not update role.");
    }
}

export async function deleteRole(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "roles", id));
    } catch (e) {
        console.error("Error deleting role: ", e);
        throw new Error("Could not delete role.");
    }
}

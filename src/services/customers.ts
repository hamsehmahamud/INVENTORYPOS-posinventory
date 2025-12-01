

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import type { Customer } from "@/lib/types";

export async function getCustomers(): Promise<Customer[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const customers: Customer[] = [];
        querySnapshot.forEach((doc) => {
            customers.push({ id: doc.id, ...doc.data() } as Customer);
        });
        return customers;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch customers");
    }
}


export async function getCustomerById(id: string): Promise<Customer | null> {
    try {
        const docRef = doc(db, "customers", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Customer;
        } else {
            console.log("No such customer document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting customer by ID: ", error);
        throw new Error("Could not fetch customer details");
    }
}


export async function addCustomer(customer: Partial<Omit<Customer, 'id' | 'registered' | 'currentBalance'>>): Promise<string> {
    try {
        const customerData = {
          ...customer,
          registered: new Date().toISOString(),
          currentBalance: customer.openingBalance || 0,
        };

        // Firestore doesn't accept `undefined` values.
        Object.keys(customerData).forEach(key => {
            const K = key as keyof typeof customerData;
            if (customerData[K] === undefined) {
                delete customerData[K];
            }
        });

        const docRef = await addDoc(collection(db, "customers"), customerData);
        return docRef.id;
    } catch (error) {
        console.error("Error adding customer: ", error);
        throw new Error("Could not add customer");
    }
}


export async function updateCustomer(id: string, data: Partial<Omit<Customer, 'id'>>): Promise<void> {
    try {
        const customerRef = doc(db, "customers", id);
        await setDoc(customerRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating customer: ", error);
        throw new Error("Could not update customer");
    }
}

export async function deleteCustomer(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "customers", id));
    } catch (error) {
        console.error("Error deleting customer: ", error);
        throw new Error("Could not delete customer");
    }
}

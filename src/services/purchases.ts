

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, writeBatch, doc, getDoc, Timestamp, runTransaction, increment, setDoc, deleteDoc } from "firebase/firestore";
import type { Purchase, Supplier } from "@/lib/types";

// --- Purchases ---

export async function getPurchases(): Promise<Purchase[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "purchases"));
        let purchases: Purchase[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore Timestamp to string
            const purchaseDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;

            purchases.push({ 
                id: doc.id, 
                ...data,
                date: purchaseDate
            } as Purchase);
        });

        return purchases;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch purchases");
    }
}


export async function getPurchaseById(id: string): Promise<Purchase | null> {
    try {
        const docRef = doc(db, "purchases", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const purchaseDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
            return {
                id: docSnap.id,
                ...data,
                date: purchaseDate
            } as Purchase;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting purchase by ID: ", error);
        throw new Error("Could not fetch purchase details");
    }
}

export async function addPurchase(purchaseData: Omit<Purchase, 'id'>): Promise<string> {
    try {
        const docRef = await runTransaction(db, async (transaction) => {
            // 1. Create the purchase document
            const newPurchaseRef = doc(collection(db, "purchases"));
            transaction.set(newPurchaseRef, {
                ...purchaseData,
                date: new Date(purchaseData.date)
            });

            // 2. Update item stock if status is 'Received'
            if (purchaseData.orderStatus === 'Received') {
                for (const item of purchaseData.items) {
                    if(item.dbItemId) {
                        const itemRef = doc(db, "items", item.dbItemId);
                         transaction.update(itemRef, {
                            quantity: increment(item.quantity)
                        });
                    }
                }
            }

            // 3. Update supplier's balance
            if (purchaseData.supplierId && purchaseData.dueAmount > 0) {
                const supplierRef = doc(db, "suppliers", purchaseData.supplierId);
                transaction.update(supplierRef, {
                    initialBalance: increment(purchaseData.dueAmount)
                });
            }

            return newPurchaseRef.id;
        });
        return docRef;
    } catch (error) {
        console.error("Error adding purchase:", error);
        throw new Error("Could not create purchase order.");
    }
}

export async function updatePurchase(id: string, data: Partial<Omit<Purchase, 'id'>>): Promise<void> {
    try {
        const purchaseRef = doc(db, "purchases", id);
        await setDoc(purchaseRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating purchase: ", error);
        throw new Error("Could not update purchase");
    }
}

export async function deletePurchase(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "purchases", id));
    } catch (error) {
        console.error("Error deleting purchase: ", error);
        throw new Error("Could not delete purchase");
    }
}


// --- Suppliers ---

// This service is now in src/services/suppliers.ts
// The contents have been moved.
// Keeping the file for now to avoid breaking imports, but it should be cleaned up.
export async function getSuppliers(): Promise<Supplier[]> {
     try {
        const querySnapshot = await getDocs(collection(db, "suppliers"));
        const suppliers: Supplier[] = [];
        querySnapshot.forEach((doc) => {
            suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
        });

        return suppliers;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch suppliers");
    }
}

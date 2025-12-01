

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, serverTimestamp, setDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import type { Supplier } from "@/lib/types";

// --- Suppliers ---

async function getNextSupplierId(): Promise<string> {
    const q = query(collection(db, "suppliers"), orderBy("supplierId", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return "SU001";
    }
    const lastId = querySnapshot.docs[0].data().supplierId;
    const lastNumber = parseInt(lastId.replace("SU", ""), 10);
    const newNumber = lastNumber + 1;
    return `SU${newNumber.toString().padStart(3, '0')}`;
}

export async function getSuppliers(): Promise<Supplier[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "suppliers"));
        const suppliers: Supplier[] = [];
        querySnapshot.forEach((doc) => {
            suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
        });
        return suppliers;
    } catch (e) {
        console.error("Error getting suppliers: ", e);
        throw new Error("Could not fetch suppliers");
    }
}

export async function addSupplier(supplier: Omit<Supplier, 'id' | 'createdDate' | 'supplierId'>): Promise<string> {
    try {
        const newSupplierId = await getNextSupplierId();
        const supplierData = { ...supplier };
        // Firestore doesn't accept `undefined` values.
        Object.keys(supplierData).forEach(key => {
            const K = key as keyof typeof supplierData;
            if (supplierData[K] === undefined) {
                delete supplierData[K];
            }
        });

        const docRef = await addDoc(collection(db, "suppliers"), {
            ...supplierData,
            supplierId: newSupplierId,
            createdDate: new Date().toISOString()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding supplier: ", e);
        throw new Error("Could not add new supplier");
    }
}


export async function getSupplierById(id: string): Promise<Supplier | null> {
    try {
        const docRef = doc(db, "suppliers", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            } as Supplier;
        } else {
            console.log("No such supplier document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting supplier by ID: ", error);
        throw new Error("Could not fetch supplier details");
    }
}

export async function updateSupplier(id: string, data: Partial<Omit<Supplier, 'id'>>): Promise<void> {
    try {
        const supplierRef = doc(db, "suppliers", id);
        await setDoc(supplierRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating supplier: ", error);
        throw new Error("Could not update supplier");
    }
}


export async function deleteSupplier(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "suppliers", id));
    } catch (error) {
        console.error("Error deleting supplier: ", error);
        throw new Error("Could not delete supplier");
    }
}


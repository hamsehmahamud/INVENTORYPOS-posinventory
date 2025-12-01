
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import type { Warehouse } from "@/lib/types";

export async function getWarehouses(): Promise<Warehouse[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "warehouses"));
        const warehouses: Warehouse[] = [];
        querySnapshot.forEach((doc) => {
            warehouses.push({ id: doc.id, ...doc.data() } as Warehouse);
        });
        return warehouses;
    } catch (e) {
        console.error("Error getting warehouses: ", e);
        throw new Error("Could not fetch warehouses");
    }
}

export async function getWarehouseById(id: string): Promise<Warehouse | null> {
    try {
        const docRef = doc(db, "warehouses", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Warehouse;
        } else {
            console.log("No such warehouse document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting warehouse by ID: ", error);
        throw new Error("Could not fetch warehouse details");
    }
}

export async function addWarehouse(warehouse: Omit<Warehouse, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "warehouses"), warehouse);
        return docRef.id;
    } catch (error) {
        console.error("Error adding warehouse: ", error);
        throw new Error("Could not add warehouse");
    }
}

export async function updateWarehouse(id: string, data: Partial<Omit<Warehouse, 'id'>>): Promise<void> {
    try {
        const warehouseRef = doc(db, "warehouses", id);
        await setDoc(warehouseRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating warehouse: ", error);
        throw new Error("Could not update warehouse");
    }
}

export async function deleteWarehouse(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "warehouses", id));
    } catch (error) {
        console.error("Error deleting warehouse: ", error);
        throw new Error("Could not delete warehouse");
    }
}

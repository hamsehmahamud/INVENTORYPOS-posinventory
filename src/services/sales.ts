

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, Timestamp, deleteDoc, setDoc } from "firebase/firestore";
import type { Sale } from "@/lib/types";

export interface SaleWithItems extends Sale {
    items: {
        itemId: string;
        name: string;
        quantity: number;
        price: number;
    }[];
    payments?: {
        type: string;
        amount: number;
        note?: string;
        date: any; // Can be Timestamp or string
    }[];
    taxAmount?: number;
    grandTotal: number;
}


export async function getSales(): Promise<SaleWithItems[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        const sales: SaleWithItems[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const saleDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;

            sales.push({ 
                id: doc.id, 
                ...data,
                date: saleDate,
                items: data.items || [],
                payments: data.payments || [],
                createdBy: data.createdBy || 'Admin'
            } as SaleWithItems);
        });

        return sales;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch sales");
    }
}


export async function getSaleById(orderId: string): Promise<SaleWithItems | null> {
    try {
        const docRef = doc(db, "sales", orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const saleData = {
                id: docSnap.id,
                orderId: data.orderId,
                customer: data.customer,
                customerId: data.customerId,
                date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                status: data.status,
                total: data.total,
                items: data.items,
                payments: data.payments || [],
                otherCharges: data.otherCharges || 0,
                discount: data.discount || 0,
                createdBy: data.createdBy || 'Admin',
                grandTotal: data.grandTotal || data.total
            } as SaleWithItems;

            const subtotal = saleData.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
            saleData.taxAmount = 0; // Simplified

            return saleData;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting sale by ID: ", error);
        throw new Error("Could not fetch sale details");
    }
}


export async function deleteSale(id: string): Promise<void> {
    try {
        // In a real app, you might want to adjust stock levels here
        await deleteDoc(doc(db, "sales", id));
    } catch (error) {
        console.error("Error deleting sale: ", error);
        throw new Error("Could not delete sale");
    }
}

export async function updateSale(id: string, data: Partial<Omit<SaleWithItems, 'id'>>): Promise<void> {
    try {
        const saleRef = doc(db, "sales", id);
        // Note: Stock adjustments on edit would be complex and are omitted here.
        // A real implementation would need to calculate the difference in items and adjust stock.
        await setDoc(saleRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating sale: ", error);
        throw new Error("Could not update sale");
    }
}

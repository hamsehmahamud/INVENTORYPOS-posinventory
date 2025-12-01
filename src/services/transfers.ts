
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, runTransaction, increment, Timestamp } from "firebase/firestore";
import type { StockTransfer } from "@/lib/types";

export async function createStockTransfer(transferData: Omit<StockTransfer, 'id'>): Promise<string> {
    try {
        const docRef = await runTransaction(db, async (transaction) => {
            const newTransferRef = doc(collection(db, "stockTransfers"));
            
            transaction.set(newTransferRef, {
                ...transferData,
                date: new Date(transferData.date)
            });

            for (const item of transferData.items) {
                // Decrement stock from source warehouse
                const fromItemRef = doc(db, "items", item.itemId);
                transaction.update(fromItemRef, {
                    quantity: increment(-item.quantity)
                });
                
                // Set the new warehouse for the transferred item
                // This assumes we create a new item or update an existing one at the destination
                // For simplicity, we just update the warehouse field. A more complex system
                // might have separate stock records per warehouse.
                 transaction.update(fromItemRef, {
                    warehouse: transferData.toWarehouseId
                });
            }

            return newTransferRef.id;
        });

        return docRef;

    } catch (error) {
        console.error("Error creating stock transfer:", error);
        throw new Error("Could not complete stock transfer.");
    }
}


export async function getStockTransfers(): Promise<StockTransfer[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "stockTransfers"));
        const transfers: StockTransfer[] = [];
        querySnapshot.forEach((doc) => {
             const data = doc.data();
            const transferDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
            transfers.push({ 
                id: doc.id, 
                ...data,
                date: transferDate
            } as StockTransfer);
        });
        return transfers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
        console.error("Error getting stock transfers: ", e);
        throw new Error("Could not fetch stock transfers");
    }
}

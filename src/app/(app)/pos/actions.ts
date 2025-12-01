
'use server';

import { db, auth } from "@/lib/firebase";
import { collection, addDoc, doc, writeBatch, Timestamp, increment, getDocs, query, where, runTransaction, orderBy, limit } from "firebase/firestore";
import type { Item, Customer } from "@/lib/types";
import { SaleWithItems } from "@/services/sales";

export interface OrderPayload extends Omit<SaleWithItems, 'id' | 'date'> {
    date: Date;
}

async function getNextSaleId(): Promise<string> {
    const q = query(collection(db, "sales"), orderBy("orderId", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return "SAL-0001";
    }
    const lastId = querySnapshot.docs[0].data().orderId;
    const lastNumberMatch = lastId.match(/(\d+)$/);
    if (!lastNumberMatch) {
      return "SAL-0001";
    }
    const lastNumber = parseInt(lastNumberMatch[0], 10);
    const newNumber = lastNumber + 1;
    return `SAL-${newNumber.toString().padStart(4, '0')}`;
}

export async function createSaleAction(payload: OrderPayload): Promise<{ success: boolean; message?: string; orderId?: string }> {

  try {
    const saleId = await runTransaction(db, async (transaction) => {
      // Rule: All reads must come before all writes.

      // 1. READS: Fetch all necessary documents first.
      const itemRefsAndDocs: { ref: any, data: Item, requestedQty: number }[] = [];
      const itemIds = payload.items.map(item => item.itemId).filter(Boolean);

      if (payload.status !== 'Pending' && itemIds.length > 0) {
        const itemDocs = await Promise.all(itemIds.map(id => transaction.get(doc(db, "items", id))));
        for (let i = 0; i < itemDocs.length; i++) {
          const itemDoc = itemDocs[i];
          const payloadItem = payload.items.find(pi => pi.itemId === itemDoc.id);

          if (!itemDoc.exists()) {
            throw new Error(`Item with ID ${itemDoc.id} not found.`);
          }
          if (!payloadItem) {
            throw new Error(`Could not find payload item for doc ID ${itemDoc.id}`);
          }
          
          const currentItemData = itemDoc.data() as Item;
          if (currentItemData.quantity < payloadItem.quantity) {
             throw new Error(`Not enough stock for ${currentItemData.name}. Available: ${currentItemData.quantity}, Requested: ${payloadItem.quantity}`);
          }
          itemRefsAndDocs.push({ ref: itemDoc.ref, data: currentItemData, requestedQty: payloadItem.quantity });
        }
      }

      // Read for next Sale ID
      const newSaleId = await getNextSaleId();

      // 2. WRITES: Now perform all writes.
      const salesCollection = collection(db, "sales");
      const newSaleRef = doc(salesCollection);
      
      // a. Write the new sale document.
      transaction.set(newSaleRef, {
        ...payload,
        orderId: newSaleId,
        date: Timestamp.fromDate(payload.date),
        payments: payload.payments?.map(p => ({...p, date: Timestamp.fromDate(p.date as Date)})) || [],
      });

      // b. Update item stock.
      if (payload.status !== 'Pending') {
        itemRefsAndDocs.forEach(({ ref, requestedQty }) => {
          transaction.update(ref, {
            quantity: increment(-requestedQty)
          });
        });
      }
      
      // c. Update customer balance for sales with due amounts.
      if (payload.customerId !== 'walkin' && payload.customerId) {
        const totalPaid = payload.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
        const dueAmount = payload.grandTotal - totalPaid;

        if (dueAmount > 0) {
            const customerRef = doc(db, "customers", payload.customerId);
            transaction.update(customerRef, {
                currentBalance: increment(dueAmount)
            });
        }
      }
      
      return newSaleRef.id;
    });

    return { success: true, orderId: saleId };

  } catch (error) {
    console.error("Failed to create sale:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to create sale: ${errorMessage}` };
  }
}

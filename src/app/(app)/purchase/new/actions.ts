

'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, query, orderBy, limit } from "firebase/firestore";
import type { Purchase } from '@/lib/types';

async function getNextPurchaseId(): Promise<string> {
    const q = query(collection(db, "purchases"), orderBy("purchaseId", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return "PUR-0001";
    }
    const lastId = querySnapshot.docs[0].data().purchaseId;
    const lastNumberMatch = lastId.match(/(\d+)$/);
    if (!lastNumberMatch) {
        return "PUR-0001";
    }
    const lastNumber = parseInt(lastNumberMatch[0], 10);
    const newNumber = lastNumber + 1;
    return `PUR-${newNumber.toString().padStart(4, '0')}`;
}

export async function createPurchaseAction(purchaseData: Omit<Purchase, 'id' | 'purchaseId'>): Promise<{ success: boolean; message?: string; purchaseId?: string }> {
  try {
    const newPurchaseId = await getNextPurchaseId();
    const docRef = await addDoc(collection(db, "purchases"), {
        ...purchaseData,
        purchaseId: newPurchaseId
    });
    return { success: true, purchaseId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to create purchase: ${errorMessage}` };
  }
}

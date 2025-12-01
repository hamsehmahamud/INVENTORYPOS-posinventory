
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp, writeBatch, doc, getDoc, setDoc, deleteDoc, runTransaction, increment, query, orderBy, limit } from "firebase/firestore";
import type { SupplierPayment } from "@/lib/types";

async function getNextSupplierPaymentId(): Promise<string> {
    const q = query(collection(db, "supplierPayments"), orderBy("paymentId", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return "SPY-0001";
    }
    const lastId = querySnapshot.docs[0].data().paymentId;
     const lastNumberMatch = lastId.match(/(\d+)$/);
    if (!lastNumberMatch) {
      return "SPY-0001";
    }
    const lastNumber = parseInt(lastNumberMatch[0], 10);
    const newNumber = lastNumber + 1;
    return `SPY-${newNumber.toString().padStart(4, '0')}`;
}

export async function getSupplierPayments(): Promise<SupplierPayment[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "supplierPayments"));
        let payments: SupplierPayment[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const paymentDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
            payments.push({ 
                id: doc.id, 
                ...data,
                date: paymentDate
            } as SupplierPayment);
        });
        return payments;
    } catch (e) {
        console.error("Error getting supplier payments: ", e);
        throw new Error("Could not fetch supplier payments");
    }
}

export async function getSupplierPaymentById(id: string): Promise<SupplierPayment | null> {
    try {
        const docRef = doc(db, "supplierPayments", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
            } as SupplierPayment;
        } else {
            console.log("No such supplier payment document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting supplier payment by ID: ", error);
        throw new Error("Could not fetch supplier payment details");
    }
}


export async function addSupplierPayment(payment: Omit<SupplierPayment, 'id' | 'paymentId'>): Promise<string> {
    const supplierRef = doc(db, "suppliers", payment.supplierId);
    
    try {
        const paymentId = await runTransaction(db, async (transaction) => {
            // 1. Create the new payment document
            const newPaymentRef = doc(collection(db, "supplierPayments"));
            const newPaymentId = await getNextSupplierPaymentId();
            transaction.set(newPaymentRef, {
                ...payment,
                paymentId: newPaymentId,
                date: new Date(payment.date)
            });

            // 2. Update the supplier's balance
            // We subtract the payment amount from the balance, as we are paying off a debt.
            transaction.update(supplierRef, {
                initialBalance: increment(-payment.amount)
            });

            return newPaymentId;
        });
        return paymentId;
    } catch (error) {
        console.error('Error adding supplier payment: ', error);
        throw new Error('Could not add supplier payment');
    }
}

export async function updateSupplierPayment(id: string, data: Partial<Omit<SupplierPayment, 'id'>>): Promise<void> {
    try {
        const paymentRef = doc(db, "supplierPayments", id);
        await setDoc(paymentRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating supplier payment: ", error);
        throw new Error("Could not update supplier payment");
    }
}

export async function deleteSupplierPayment(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "supplierPayments", id));
    } catch (error) {
        console.error("Error deleting supplier payment: ", error);
        throw new Error("Could not delete supplier payment");
    }
}

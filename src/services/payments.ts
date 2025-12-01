
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp, writeBatch, doc, getDoc, setDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import type { Payment } from "@/lib/types";

async function getNextPaymentId(): Promise<string> {
    const q = query(collection(db, "payments"), orderBy("paymentId", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return "PAY-0001";
    }
    const lastId = querySnapshot.docs[0].data().paymentId;
    const lastNumberMatch = lastId.match(/(\d+)$/);
    if (!lastNumberMatch) {
      return "PAY-0001";
    }
    const lastNumber = parseInt(lastNumberMatch[0], 10);
    const newNumber = lastNumber + 1;
    return `PAY-${newNumber.toString().padStart(4, '0')}`;
}


export async function getPayments(): Promise<Payment[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "payments"));
        let payments: Payment[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const paymentDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
            payments.push({ 
                id: doc.id, 
                ...data,
                date: paymentDate
            } as Payment);
        });
        return payments;
    } catch (e) {
        console.error("Error getting payments: ", e);
        throw new Error("Could not fetch payments");
    }
}

export async function getPaymentById(id: string): Promise<Payment | null> {
    try {
        const docRef = doc(db, "payments", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
            } as Payment;
        } else {
            console.log("No such payment document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting payment by ID: ", error);
        throw new Error("Could not fetch payment details");
    }
}


export async function addPayment(payment: Omit<Payment, 'id' | 'paymentId'>): Promise<string> {
  try {
    const paymentId = await getNextPaymentId();
    const docRef = await addDoc(collection(db, 'payments'), {
        ...payment,
        paymentId,
        date: new Date(payment.date)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding payment: ', error);
    throw new Error('Could not add payment');
  }
}

export async function updatePayment(id: string, data: Partial<Omit<Payment, 'id'>>): Promise<void> {
    try {
        const paymentRef = doc(db, "payments", id);
        await setDoc(paymentRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating payment: ", error);
        throw new Error("Could not update payment");
    }
}

export async function deletePayment(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "payments", id));
    } catch (error) {
        console.error("Error deleting payment: ", error);
        throw new Error("Could not delete payment");
    }
}

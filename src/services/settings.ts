
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore";
import type { CompanyInfo, Currency } from "@/lib/types";

export async function getCompanyInfo(): Promise<CompanyInfo> {
    try {
        const q = query(collection(db, "companyInfo"), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log("No company info found, creating default...");
            const defaultInfo: Omit<CompanyInfo, 'id'> = {
                name: "My Company",
                version: "1.0",
                email: "contact@mycompany.com",
            };
            const docRef = await addDoc(collection(db, "companyInfo"), defaultInfo);
            return { id: docRef.id, ...defaultInfo };
        }
        
        const docSnap = querySnapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as CompanyInfo;

    } catch (e) {
        console.error("Error getting company info: ", e);
        throw new Error("Could not fetch company info");
    }
}


export async function updateCompanyInfo(info: CompanyInfo): Promise<void> {
    if (!info.id) {
        throw new Error("Company info ID is missing. Cannot update.");
    }
    try {
        const companyInfoRef = doc(db, "companyInfo", info.id);
        await setDoc(companyInfoRef, info, { merge: true });
    } catch (e) {
        console.error("Error updating company info: ", e);
        throw new Error("Could not update company info");
    }
}


// --- Currencies ---

export async function getCurrencies(): Promise<Currency[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "currencies"));
        const currencies: Currency[] = [];
        querySnapshot.forEach((doc) => {
            currencies.push({ id: doc.id, ...doc.data() } as Currency);
        });
        return currencies;
    } catch (e) {
        console.error("Error getting currencies: ", e);
        throw new Error("Could not fetch currencies");
    }
}

export async function addCurrency(currency: Omit<Currency, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'currencies'), currency);
    return docRef.id;
  } catch (error) {
    console.error('Error adding currency: ', error);
    throw new Error('Could not add currency');
  }
}

export async function updateCurrency(currency: Currency): Promise<void> {
  if (!currency.id) {
    throw new Error("Currency ID is missing. Cannot update.");
  }
  try {
    const currencyRef = doc(db, "currencies", currency.id);
    const { id, ...currencyData } = currency;
    await setDoc(currencyRef, currencyData, { merge: true });
  } catch (e) {
    console.error("Error updating currency: ", e);
    throw new Error("Could not update currency");
  }
}

export async function deleteCurrency(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "currencies", id));
  } catch (e) {
    console.error("Error deleting currency: ", e);
    throw new Error("Could not delete currency");
  }
}

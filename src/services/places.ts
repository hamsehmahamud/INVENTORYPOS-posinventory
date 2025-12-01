
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, writeBatch, doc } from "firebase/firestore";
import type { Country, State } from "@/lib/types";

// --- Countries ---

export async function getCountries(): Promise<Country[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "countries"));
        const countries: Country[] = [];
        querySnapshot.forEach((doc) => {
            countries.push({ id: doc.id, ...doc.data() } as Country);
        });
        return countries;
    } catch (e) {
        console.error("Error getting countries: ", e);
        throw new Error("Could not fetch countries");
    }
}

export async function addCountry(country: Omit<Country, 'id' | 'status'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'countries'), {
        ...country,
        status: 'Active',
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding country: ', error);
    throw new Error('Could not add country');
  }
}

// --- States ---

export async function getStates(): Promise<State[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "states"));
        const states: State[] = [];
        querySnapshot.forEach((doc) => {
            states.push({ id: doc.id, ...doc.data() } as State);
        });
        return states;
    } catch (e) {
        console.error("Error getting states: ", e);
        throw new Error("Could not fetch states");
    }
}

export async function addState(state: Omit<State, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'states'), state);
    return docRef.id;
  } catch (error) {
    console.error('Error adding state: ', error);
    throw new Error('Could not add state');
  }
}

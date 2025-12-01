
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, writeBatch, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import type { Item, Category, Brand } from "@/lib/types";

// --- Items ---

export async function getItems(): Promise<Item[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "items"));
        const items: Item[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data 
            } as Item);
        });
        return items;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch items");
    }
}

export async function getItemById(id: string): Promise<Item | null> {
    try {
        const docRef = doc(db, "items", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Item;
        } else {
            console.log("No such item document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting item by ID: ", error);
        throw new Error("Could not fetch item details");
    }
}

export async function addItem(item: Omit<Item, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "items"), item);
        return docRef.id;
    } catch (error) {
        console.error("Error adding item: ", error);
        throw new Error("Could not add item");
    }
}

export async function updateItem(id: string, data: Partial<Omit<Item, 'id'>>): Promise<void> {
    try {
        const itemRef = doc(db, "items", id);
        await setDoc(itemRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating item: ", error);
        throw new Error("Could not update item");
    }
}

export async function deleteItem(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "items", id));
    } catch (error) {
        console.error("Error deleting item: ", error);
        throw new Error("Could not delete item");
    }
}

export async function addItems(items: Omit<Item, 'id'>[]): Promise<{ success: boolean, count: number }> {
    const batch = writeBatch(db);
    const itemsCollection = collection(db, "items");

    items.forEach(item => {
        const newDocRef = doc(itemsCollection);
        batch.set(newDocRef, item);
    });

    await batch.commit();
    return { success: true, count: items.length };
}


// --- Categories ---

export async function getCategories(): Promise<Category[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const categories: Category[] = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() } as Category);
        });
        return categories;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch categories");
    }
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'categories'), category);
    return docRef.id;
  } catch (error) {
    console.error('Error adding category: ', error);
    throw new Error('Could not add category');
  }
}


// --- Brands ---

export async function getBrands(): Promise<Brand[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "brands"));
        const brands: Brand[] = [];
        querySnapshot.forEach((doc) => {
            brands.push({ id: doc.id, ...doc.data() } as Brand);
        });
        return brands;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch brands");
    }
}

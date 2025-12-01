
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp, writeBatch, doc } from "firebase/firestore";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { useAuth } from "@/context/auth-context";

// --- Expenses ---

export async function getExpenses(): Promise<Expense[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "expenses"));
        let expenses: Expense[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const expenseDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
            expenses.push({ 
                id: doc.id, 
                ...data,
                date: expenseDate
            } as Expense);
        });

        return expenses;
    } catch (e) {
        console.error("Error getting expenses: ", e);
        throw new Error("Could not fetch expenses");
    }
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), {
        ...expense,
        date: new Date(expense.date)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense: ', error);
    throw new Error('Could not add expense');
  }
}

// --- Expense Categories ---

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "expenseCategories"));
        const categories: ExpenseCategory[] = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() } as ExpenseCategory);
        });

        return categories;
    } catch (e) {
        console.error("Error getting expense categories: ", e);
        throw new Error("Could not fetch expense categories");
    }
}

export async function addExpenseCategory(category: Omit<ExpenseCategory, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "expenseCategories"), category);
        return docRef.id;
    } catch (error) {
        console.error("Error adding expense category: ", error);
        throw new Error("Could not add expense category");
    }
}

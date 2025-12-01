'use server';

import { addItems } from '@/services/items';
import type { Item } from '@/lib/types';

export async function importItemsAction(items: Omit<Item, 'id'>[]): Promise<{ success: boolean; message: string }> {
  if (!items || items.length === 0) {
    return { success: false, message: 'No items to import.' };
  }

  try {
    const result = await addItems(items);
    return { success: true, message: `${result.count} items imported successfully.` };
  } catch (error) {
    console.error('Failed to import items:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to import items: ${errorMessage}` };
  }
}

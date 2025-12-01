"use server";

import {
  suggestOptimalPricing,
  type SuggestOptimalPricingInput,
} from "@/ai/flows/suggest-optimal-pricing";
import type { SuggestOptimalPriceState } from "@/lib/types";

export async function suggestOptimalPriceAction(
  _prevState: SuggestOptimalPriceState,
  formData: FormData
): Promise<SuggestOptimalPriceState> {
  const input: SuggestOptimalPricingInput = {
    productName: formData.get("productName") as string,
    salesTrends: formData.get("salesTrends") as string,
    competitorPrices: formData.get("competitorPrices") as string,
    marketDemand: formData.get("marketDemand") as string,
  };

  try {
    const result = await suggestOptimalPricing(input);
    return result;
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error(error);
    return {
      error,
    };
  }
}

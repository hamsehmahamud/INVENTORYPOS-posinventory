"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Lightbulb, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { suggestOptimalPriceAction } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Lightbulb className="mr-2 h-4 w-4" />
          Get Suggestion
        </>
      )}
    </Button>
  );
}

export default function PricingAssistantPage() {
  const [state, formAction] = useFormState(suggestOptimalPriceAction, {});

  return (
    <div className="grid gap-6 max-w-2xl mx-auto">
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle>AI Pricing Assistant</CardTitle>
            <CardDescription>
              Get an AI-powered pricing suggestion based on market data.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                name="productName"
                placeholder="e.g., Wireless Headphones"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="salesTrends">Sales Trends</Label>
              <Textarea
                id="salesTrends"
                name="salesTrends"
                placeholder="e.g., Steady increase over the last quarter, with a peak during holiday seasons."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="competitorPrices">Competitor Prices</Label>
              <Textarea
                id="competitorPrices"
                name="competitorPrices"
                placeholder="e.g., Brand A: ₹8,500, Brand B: ₹9,200, Brand C: ₹7,900"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="marketDemand">Market Demand</Label>
              <Textarea
                id="marketDemand"
                name="marketDemand"
                placeholder="e.g., High demand among young professionals and students. Feature X is highly sought after."
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      {state.suggestedPrice && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Suggestion</CardTitle>
            <CardDescription>
              Here is the AI-generated optimal price for your product.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                ₹{state.suggestedPrice.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">Suggested Price</span>
            </div>
            <div>
              <h4 className="font-semibold">Reasoning</h4>
              <p className="text-muted-foreground text-sm">
                {state.reasoning}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {state.error && (
         <Alert variant="destructive">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

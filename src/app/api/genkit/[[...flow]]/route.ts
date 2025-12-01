import "@/ai/dev";
import { appRoute } from "@genkit-ai/next";
import { ai } from "@/ai/genkit";

export const { GET, POST } = appRoute(ai);

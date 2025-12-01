import "@/ai/dev";
import { GENKIT_API_DEFAULT_OPTIONS, genkitAPI } from "@genkit-ai/next";

export const { GET, POST } = genkitAPI(GENKIT_API_DEFAULT_OPTIONS);

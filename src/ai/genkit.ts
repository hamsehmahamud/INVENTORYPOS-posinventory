import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: "AIzaSyBbIl7mZgG22XdD4XXJq-CDxKI_xiHG5Sg" })],
  model: 'googleai/gemini-2.0-flash',
});

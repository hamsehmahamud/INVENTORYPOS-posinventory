import { z } from 'genkit';
import { ai } from '../genkit';

export const supportFlow = ai.defineFlow(
    {
        name: 'supportFlow',
        inputSchema: z.object({
            question: z.string(),
        }),
        outputSchema: z.string(),
    },
    async ({ question }) => {
        const { text } = await ai.generate({
            prompt: `You are a helpful AI support assistant for the "Maareye Inventory POS" system.
      Your goal is to help users with questions about the system, including how to use features like Sales, Purchases, Inventory, Reports, etc.
      
      The system has the following main features:
      - Dashboard: Overview of sales, purchases, expenses.
      - Items: Manage inventory, categories, brands.
      - Sales: POS interface, sales list, returns.
      - Purchases: Purchase orders, returns.
      - Customers & Suppliers: Management and statements.
      - Expenses: Track business expenses.
      - Accounting: Accounts receivable and payable.
      - Reports: Profit & loss, stock reports, etc.
      - Settings: Site settings, tax, currency, users.

      User Question: ${question}
      
      Answer the user's question clearly and concisely. If you don't know the answer, suggest they check the Help page or contact support at hamsehmahamud@gmail.com.`,
        });
        return text;
    }
);

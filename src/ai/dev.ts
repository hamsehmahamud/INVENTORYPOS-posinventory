import { config } from 'dotenv';
import { supportFlow } from './flows/support';
config();

(async () => {
    supportFlow;
})();

import '@/ai/flows/suggest-optimal-pricing.ts';

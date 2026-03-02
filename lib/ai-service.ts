import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function enrichTransactionWithAI(content: string) {
  const { object } = await generateObject({
    model: google('gemini-1.5-flash'),
    schema: z.object({
      category: z.enum(['Groceries', 'Utilities', 'Transport', 'Rent', 'Business', 'Agribusiness', 'Construction & Labour', 'Personal Transfer', 'Other']),
      recipient: z.string(),
      refinedPurpose: z.string(),
      merchantType: z.string()
    }),
    system: `You are a Kenyan Financial Analyst. Resolve nicknames to formal names.
             - "Mum KE" -> Use the recipient's full name in the text (e.g. Kenneth Ocholla).
             - "Hives", "Bees", "Honey" -> Category: 'Agribusiness'.
             - "Crusher", "Labour", "Building", "Materials" -> Category: 'Construction & Labour'.`,
    prompt: `Analyze: "${content}"`,
  });
  return object;
}
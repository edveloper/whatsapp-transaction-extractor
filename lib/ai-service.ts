import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function enrichTransactionWithAI(content: string) {
  const { object } = await generateObject({
    // "-latest" alias instead of a pinned version: Google has retired multiple dated Gemini
    // model names within months of each other (1.5-flash, then 2.5-flash), silently breaking
    // this call every time. The alias tracks whatever the current recommended flash model is.
    model: google('gemini-flash-latest'),
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
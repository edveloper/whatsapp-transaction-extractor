"use server"

// We will use this later to save transactions to a database 
// or perform server-side calculations.

export interface Transaction {
  Date: string
  Amount: number
  Type: string
  Reference: string
  "Paid By": string
  "Paid To": string
  CounterpartyId: string
  CounterpartyPhone?: string
  CounterpartyAccount?: string
  CounterpartyPaybill?: string
  CounterpartyTill?: string
  Purpose: string
  Category?: string // Added for AI categorization
  Confidence?: number // Added for AI tracking
}

export async function processExtractedData(transactions: Transaction[]) {
  try {
    console.log(`[Server Action] Processing ${transactions.length} transactions`);
    
    // For now, we just return them. Later, we can add 
    // code here to save to a database like Supabase or Vercel Postgres.
    return { success: true, data: transactions };
  } catch (error) {
    console.error("Failed to process transactions:", error);
    return { success: false, error: "Processing failed" };
  }
}

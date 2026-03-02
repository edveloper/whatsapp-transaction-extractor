import { type NextRequest, NextResponse } from "next/server"
import { enrichTransactionWithAI } from "@/lib/ai-service"
import { extractRawTransactions } from "@/lib/whatsapp-parser"

export const maxDuration = 300

const AI_ENRICH_LIMIT = 10

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      return NextResponse.json({ error: "Only WhatsApp .txt exports are supported." }, { status: 400 })
    }

    const text = await file.text()
    const rawTransactions = extractRawTransactions(text)

    const enrichedTransactions = await Promise.all(
      rawTransactions.map(async (tx, index) => {
        if (index >= AI_ENRICH_LIMIT) {
          return {
            ...tx,
            Category: tx.Category || "Other",
            rawContent: undefined,
          }
        }

        try {
          const aiData = await enrichTransactionWithAI(tx.rawContent || "")
          return {
            ...tx,
            Category: aiData.category,
            "Paid To": aiData.recipient || tx["Paid To"],
            Purpose: aiData.refinedPurpose || tx.Purpose,
            MerchantType: aiData.merchantType,
            rawContent: undefined,
          }
        } catch (error) {
          console.error("AI enrichment failed:", error)
          return { ...tx, Category: "Other", rawContent: undefined }
        }
      }),
    )

    return NextResponse.json({ transactions: enrichedTransactions, count: enrichedTransactions.length })
  } catch (error) {
    console.error("Extraction failed:", error)
    return NextResponse.json({ error: "Failed to extract transactions." }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { enrichTransactionWithAI } from "@/lib/ai-service"
import { extractRawTransactions, isLowConfidence } from "@/lib/whatsapp-parser"
import { getClientKey, isRateLimited } from "@/lib/rate-limit"

export const maxDuration = 300

const AI_ENRICH_LIMIT = 10
// Matches the limit advertised in the upload UI. Rejected via the Content-Length header before
// the body is read where possible, so an oversized upload doesn't get buffered into memory first.
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(getClientKey(request))) {
      return NextResponse.json({ error: "Too many uploads. Please wait a minute and try again." }, { status: 429 })
    }

    const contentLength = Number(request.headers.get("content-length") || 0)
    if (contentLength > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File is too large. Maximum size is 50MB." }, { status: 413 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      return NextResponse.json({ error: "Only WhatsApp .txt exports are supported." }, { status: 400 })
    }

    // Defense in depth: the content-length check above can miss cases (chunked encoding,
    // multipart overhead skew), so re-check the actual file size before doing any parsing work.
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File is too large. Maximum size is 50MB." }, { status: 413 })
    }

    const text = await file.text()
    const rawTransactions = extractRawTransactions(text)

    // AI is only worth the latency and third-party exposure on the rows regex genuinely
    // couldn't resolve confidently -- a clean M-PESA match gains nothing from a Gemini call.
    const enrichIndices = new Set(
      rawTransactions
        .map((tx, index) => ({ tx, index }))
        .filter(({ tx }) => isLowConfidence(tx))
        .slice(0, AI_ENRICH_LIMIT)
        .map(({ index }) => index),
    )

    const enrichedTransactions = await Promise.all(
      rawTransactions.map(async (tx, index) => {
        if (!enrichIndices.has(index)) {
          return {
            ...tx,
            Category: tx.Category || "Other",
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
          }
        } catch (error) {
          console.error("AI enrichment failed:", error)
          return { ...tx, Category: "Other" }
        }
      }),
    )

    return NextResponse.json({ transactions: enrichedTransactions, count: enrichedTransactions.length })
  } catch (error) {
    console.error("Extraction failed:", error)
    return NextResponse.json({ error: "Failed to extract transactions." }, { status: 500 })
  }
}

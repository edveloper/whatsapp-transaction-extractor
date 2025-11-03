import { type NextRequest, NextResponse } from "next/server"

interface Transaction {
  [key: string]: string | number
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()
    const transactions = extractTransactions(text)

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("[v0] Extraction error:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}

function extractTransactions(text: string): Transaction[] {
  const records: Transaction[] = []

  // WhatsApp message pattern: DD/MM/YYYY, HH:MM - Sender: Message
  const pattern =
    /(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2})\s*(?:in the (?:morning|afternoon)|at night)?\s*-\s*([^:]+):\s*(.*)/g

  let match
  while ((match = pattern.exec(text)) !== null) {
    const [, date, time, sender, message] = match
    const cleanedMessage = cleanMessage(message)

    // Detect if message relates to money
    if (/Ksh|KES|cash|WorldRemit|I&M|Equity|paid to|sent to|Confirm|Confirmed/i.test(cleanedMessage)) {
      let transaction: Partial<Transaction> = {}

      // Handle explicit cash notes first
      if (/\bcash\b|\bgiven\b/i.test(cleanedMessage)) {
        const cashMatch = cleanedMessage.match(
          /([0-9,]+|[0-9]+K)\s*(?:ksh|cash)?\s*(?:given|to|paid)?\s*(?:to\s+)?([A-Za-z\s]+)?/i,
        )
        if (cashMatch) {
          const rawAmount = cashMatch[1]
          const amount = rawAmount.toLowerCase().endsWith("k")
            ? Number.parseFloat(rawAmount.slice(0, -1).replace(",", "")) * 1000
            : Number.parseFloat(rawAmount.replace(",", ""))

          transaction = {
            Date: formatDateTime(date, time),
            Amount: amount,
            Type: "Cash",
            Reference: "CASH",
            "Paid By": sender,
            "Paid To": (cashMatch[2] || "").trim(),
            Purpose: cleanedMessage,
          }
        }
      } else {
        // Handle M-PESA, Bank, Remittance
        const amount = extractAmount(cleanedMessage)
        const reference = extractCode(cleanedMessage)
        const [paidBy, paidTo] = extractEntities(cleanedMessage)

        let transactionType = "Other"
        let ref = reference || ""

        if (/MPESA|M-PESA|M PESA/i.test(cleanedMessage)) {
          transactionType = "M-PESA"
        } else if (/bank|transfer|deposit|withdrawal/i.test(cleanedMessage)) {
          transactionType = "Bank Transfer"
          if (!ref && /bank/i.test(cleanedMessage)) ref = "BANK"
        } else if (/worldremit|remitly|wise|money gram|western union|xoom/i.test(cleanedMessage)) {
          transactionType = "Remittance"
          if (/worldremit/i.test(cleanedMessage)) ref = "WORLDREMIT"
          else if (/remitly/i.test(cleanedMessage)) ref = "REMITLY"
          else if (/wise/i.test(cleanedMessage)) ref = "WISE"
        }

        if (amount) {
          transaction = {
            Date: formatDateTime(date, time),
            Amount: amount,
            Type: transactionType,
            Reference: ref,
            "Paid By": paidBy || sender,
            "Paid To": paidTo,
            Purpose: cleanedMessage,
          }
        }
      }

      if (Object.keys(transaction).length > 0 && transaction.Amount) {
        records.push(transaction as Transaction)
      }
    }
  }

  return records
}

function cleanMessage(msg: string): string {
  return msg
    .replace(/in the afternoon/gi, "")
    .replace(/in the morning/gi, "")
    .replace(/at night/gi, "")
    .replace(/New M-PESA balance/gi, "M-PESA balance")
    .trim()
}

function extractAmount(msg: string): number | null {
  const match = msg.match(/(?:Ksh|KES|USD|EUR|GBP|ksh)[\s]*([0-9,]+(?:\.[0-9]+)?)/)
  if (match) {
    return Number.parseFloat(match[1].replace(/,/g, ""))
  }
  return null
}

function extractCode(msg: string): string | null {
  const match = msg.match(/\b([A-Z0-9]{8,12})\b/)
  return match ? match[1] : null
}

function extractEntities(msg: string): [string, string] {
  let paidBy = ""
  let paidTo = ""

  const sentToMatch = msg.match(/sent\s+to\s+([^on]+)/i)
  if (sentToMatch) {
    paidTo = sentToMatch[1].trim()
  }

  const receivedFromMatch = msg.match(/received\s+from\s+([^on]+)/i)
  if (receivedFromMatch) {
    paidBy = receivedFromMatch[1].trim()
  }

  const paidToMatch = msg.match(/paid\s+to\s+([^via]+)/i)
  if (paidToMatch) {
    paidTo = paidToMatch[1].trim()
  }

  return [paidBy, paidTo]
}

function formatDateTime(date: string, time: string): string {
  try {
    const [day, month, year] = date.split("/")
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`
  } catch {
    return `${date} ${time}`
  }
}

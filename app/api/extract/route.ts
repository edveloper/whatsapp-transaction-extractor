import { type NextRequest, NextResponse } from "next/server"

interface Transaction {
  [key: string]: string | number
}

interface CustomTemplate {
  id: string
  name: string
  datePattern: string
  amountPattern: string
  referencePattern: string
  paidByPattern: string
  paidToPattern: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const source = (formData.get("source") as string) || "whatsapp"
    const templateStr = formData.get("template") as string | null
    const customTemplate = templateStr ? JSON.parse(templateStr) : null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    let transactions: Transaction[] = []

    if (customTemplate) {
      const text = await file.text()
      transactions = extractWithCustomTemplate(text, customTemplate)
    } else if (source === "pdf") {
      const buffer = await file.arrayBuffer()
      transactions = extractPdfTransactions(buffer, file.name)
    } else if (source === "telegram") {
      const text = await file.text()
      transactions = extractTelegramTransactions(text)
    } else if (source === "email") {
      const text = await file.text()
      transactions = extractEmailTransactions(text)
    } else {
      const text = await file.text()
      transactions = extractWhatsAppTransactions(text)
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("[v0] Extraction error:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}

function extractWithCustomTemplate(text: string, template: CustomTemplate): Transaction[] {
  const records: Transaction[] = []

  try {
    const lines = text.split("\n")
    let currentRecord: Partial<Transaction> = {}

    for (const line of lines) {
      if (!line.trim()) continue

      if (template.datePattern) {
        try {
          const dateRegex = new RegExp(template.datePattern, "i")
          const dateMatch = line.match(dateRegex)
          if (dateMatch) {
            currentRecord.Date = dateMatch[0]
          }
        } catch (e) {
          console.error("[v0] Date pattern error:", e)
        }
      }

      if (template.amountPattern) {
        try {
          const amountRegex = new RegExp(template.amountPattern, "i")
          const amountMatch = line.match(amountRegex)
          if (amountMatch) {
            const amountStr = amountMatch[1] || amountMatch[0]
            currentRecord.Amount = Number.parseFloat(amountStr.replace(/[^\d.]/g, ""))
          }
        } catch (e) {
          console.error("[v0] Amount pattern error:", e)
        }
      }

      if (template.referencePattern) {
        try {
          const refRegex = new RegExp(template.referencePattern, "i")
          const refMatch = line.match(refRegex)
          if (refMatch) {
            currentRecord.Reference = refMatch[1] || refMatch[0]
          }
        } catch (e) {
          console.error("[v0] Reference pattern error:", e)
        }
      }

      if (template.paidByPattern) {
        try {
          const paidByRegex = new RegExp(template.paidByPattern, "i")
          const paidByMatch = line.match(paidByRegex)
          if (paidByMatch) {
            currentRecord["Paid By"] = paidByMatch[1] || paidByMatch[0]
          }
        } catch (e) {
          console.error("[v0] Paid By pattern error:", e)
        }
      }

      if (template.paidToPattern) {
        try {
          const paidToRegex = new RegExp(template.paidToPattern, "i")
          const paidToMatch = line.match(paidToRegex)
          if (paidToMatch) {
            currentRecord["Paid To"] = paidToMatch[1] || paidToMatch[0]
          }
        } catch (e) {
          console.error("[v0] Paid To pattern error:", e)
        }
      }

      if (currentRecord.Amount && (currentRecord.Date || currentRecord.Reference)) {
        const transaction: Transaction = {
          Date: currentRecord.Date || new Date().toISOString(),
          Amount: currentRecord.Amount,
          Type: "Custom",
          Reference: currentRecord.Reference || template.name,
          "Paid By": currentRecord["Paid By"] || "",
          "Paid To": currentRecord["Paid To"] || "",
          Purpose: line.trim(),
        }

        records.push(transaction)
        currentRecord = {}
      }
    }
  } catch (error) {
    console.error("[v0] Custom template extraction error:", error)
  }

  return records
}

function extractTelegramTransactions(text: string): Transaction[] {
  const records: Transaction[] = []

  const lines = text.split("\n")
  let currentDate = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.startsWith("Telegram export") || line.startsWith("=")) continue

    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2}).+?(\d{1,2}:\d{2})/)
    if (dateMatch) {
      currentDate = dateMatch[0]
    }

    if (/amount|ksh|usd|transfer|sent|received|paid|cash/i.test(line)) {
      const amount = extractAmount(line)
      const reference = extractCode(line)

      if (amount && currentDate) {
        const transactionType = detectContentTransactionType(line)

        const transaction: Transaction = {
          Date: currentDate,
          Amount: amount,
          Type: transactionType,
          Reference: reference || "TG",
          "Paid By": extractTelegramUser(text, currentDate) || "Telegram User",
          "Paid To": "",
          Purpose: line.trim(),
        }

        records.push(transaction)
      }
    }
  }

  return records
}

function detectContentTransactionType(text: string): string {
  if (/M-PESA|MPESA|mpesa/i.test(text)) return "M-PESA"
  if (/bank|transfer|deposit|swift|wire/i.test(text)) return "Bank Transfer"
  if (/worldremit|remitly|wise|xoom|money gram/i.test(text)) return "Remittance"
  if (/\bcash\b/i.test(text)) return "Cash"
  if (/card|credit/i.test(text)) return "Card"
  return "Other"
}

function extractPdfTransactions(buffer: ArrayBuffer, fileName: string): Transaction[] {
  const records: Transaction[] = []

  const uint8Array = new Uint8Array(buffer)
  let text = ""

  for (let i = 0; i < uint8Array.length; i++) {
    const byte = uint8Array[i]
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
      text += String.fromCharCode(byte)
    }
  }

  const lines = text.split(/\n|\r/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})\b/
    const dateMatch = line.match(dateRegex)

    const amountRegex = /\b([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)\b/
    const amountMatches = line.match(new RegExp(amountRegex, "g"))

    if (dateMatch && amountMatches && amountMatches.length > 0) {
      // Take the last amount match as it's likely the transaction amount
      const amountStr = amountMatches[amountMatches.length - 1]
      const amount = Number.parseFloat(amountStr.replace(/,/g, ""))

      if (amount > 0) {
        const reference = extractCode(line) || extractCodeFromText(line) || "PDF"
        const description = line.replace(dateMatch[0], "").replace(amountStr, "").trim()

        const transaction: Transaction = {
          Date: dateMatch[1],
          Amount: amount,
          Type: "Bank Statement",
          Reference: reference,
          "Paid By": "Bank",
          "Paid To": "",
          Purpose: description || "Bank Transaction",
        }

        records.push(transaction)
      }
    }
  }

  return records
}

function extractTelegramUser(text: string, date: string): string {
  const lines = text.split("\n")
  for (const line of lines) {
    if (line.includes(date)) {
      const userMatch = line.match(/(?:From|User|@)?[\s]*([A-Za-z][A-Za-z\s]*?)(?:\s*[\d:]+|$)/)
      if (userMatch) return userMatch[1].trim()
    }
  }
  return ""
}

function extractEmailTransactions(text: string): Transaction[] {
  const records: Transaction[] = []

  const lines = text.split("\n")
  let currentTransaction: Partial<Transaction> = {}
  let subject = ""
  let senderEmail = ""
  let date = ""

  for (const line of lines) {
    if (line.startsWith("Subject:")) {
      subject = line.replace("Subject:", "").trim()
    }
    if (line.startsWith("From:")) {
      senderEmail = line.replace("From:", "").trim()
    }
    if (line.startsWith("Date:")) {
      date = line.replace("Date:", "").trim()
    }

    const amountMatch = line.match(
      /(?:Amount|Transferred|Credited|Debited)[:=\s]+(?:Ksh|KES|USD|EUR|GBP|K)?[\s]*([0-9,]+(?:\.[0-9]+)?)/i,
    )
    if (amountMatch) {
      const amount = Number.parseFloat(amountMatch[1].replace(/,/g, ""))
      currentTransaction.Amount = amount
    }

    const refMatch = line.match(/(?:Reference|Code|Transaction ID|Confirmation)[:=\s]+([A-Z0-9]{6,12})/i)
    if (refMatch) {
      currentTransaction.Reference = refMatch[1]
    }

    const recipientMatch = line.match(/(?:To|Recipient|Payee)[:=\s]+([A-Za-z\s]+)/i)
    if (recipientMatch) {
      currentTransaction["Paid To"] = recipientMatch[1].trim()
    }

    const senderMatch = line.match(/(?:From|Sender|Account)[:=\s]+([A-Za-z\s0-9]+)/i)
    if (senderMatch) {
      currentTransaction["Paid By"] = senderMatch[1].trim()
    }

    const statusMatch = line.match(/(?:Status)[:=\s]+(Success|Completed|Pending|Failed)/i)
    if (statusMatch) {
      currentTransaction.Status = statusMatch[1]
    }

    if (
      currentTransaction.Amount &&
      currentTransaction.Reference &&
      (currentTransaction["Paid To"] || currentTransaction["Paid By"])
    ) {
      const transaction: Transaction = {
        Date: date || new Date().toISOString(),
        Amount: currentTransaction.Amount,
        Type: detectTransactionType(subject),
        Reference: currentTransaction.Reference || "EMAIL",
        "Paid By": currentTransaction["Paid By"] || senderEmail,
        "Paid To": currentTransaction["Paid To"] || "",
        Purpose: subject,
        Status: currentTransaction.Status || "Completed",
      }

      records.push(transaction)
      currentTransaction = {}
    }
  }

  if (records.length === 0 && subject) {
    const subjectAmount = subject.match(/([0-9,]+(?:\.[0-9]+)?)\s*(?:Ksh|KES|USD|EUR|GBP)?/i)
    if (subjectAmount) {
      const transaction: Transaction = {
        Date: date || new Date().toISOString(),
        Amount: Number.parseFloat(subjectAmount[1].replace(/,/g, "")),
        Type: detectTransactionType(subject),
        Reference: extractCodeFromText(subject) || "EMAIL",
        "Paid By": senderEmail,
        "Paid To": "",
        Purpose: subject,
        Status: "Completed",
      }
      records.push(transaction)
    }
  }

  return records
}

function extractWhatsAppTransactions(text: string): Transaction[] {
  const records: Transaction[] = []
  const allLines = text.split("\n")

  const pattern =
    /(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2})\s*(?:in the (?:morning|afternoon)|at night)?\s*-\s*([^:]+):\s*(.*)/g

  let match
  const processedIndices = new Set<number>()

  while ((match = pattern.exec(text)) !== null) {
    const [, date, time, sender, message] = match
    const cleanedMessage = cleanMessage(message)

    if (/Ksh|KES|cash|WorldRemit|I&M|Equity|paid to|sent to|Confirm|Confirmed/i.test(cleanedMessage)) {
      // Find the line index to look for context
      let lineIndex = 0
      for (let i = 0; i < allLines.length; i++) {
        if (allLines[i].includes(cleanedMessage)) {
          lineIndex = i
          break
        }
      }

      let transaction: Partial<Transaction> = {}

      if (/\bcash\b|\bgiven\b/i.test(cleanedMessage)) {
        const cashMatch = cleanedMessage.match(/([0-9,]+(?:\.[0-9]+)?)\s*([kK])(?!\w)/)
        if (cashMatch) {
          const rawAmount = cashMatch[1]
          const multiplier = 1000
          const amount = Number.parseFloat(rawAmount.replace(/,/g, "")) * multiplier

          const paidToMatch = cleanedMessage.match(
            /(?:given|to|paid)\s+(?:to\s+)?([A-Z][A-Za-z\s]+?)(?:\s*\.|,|$|\band\b)/i,
          )
          const paidTo = paidToMatch ? paidToMatch[1].trim() : ""

          transaction = {
            Date: formatDateTime(date, time),
            Amount: amount,
            Type: "Cash",
            Reference: "CASH",
            "Paid By": sender,
            "Paid To": paidTo,
            Purpose: extractPurpose(allLines, lineIndex, cleanedMessage),
          }
        }
      } else {
        const amount = extractAmountWithKSuffix(cleanedMessage)
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
            Purpose: extractPurpose(allLines, lineIndex, cleanedMessage),
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

function extractAmountWithKSuffix(msg: string): number | null {
  // First try standard currency formats
  const currencyMatch = msg.match(/(?:Ksh|KES|USD|EUR|GBP|ksh)[\s]*([0-9,]+(?:\.[0-9]+)?)/)
  if (currencyMatch) {
    return Number.parseFloat(currencyMatch[1].replace(/,/g, ""))
  }

  // Then try K suffix (2k, 5.5k, etc) with word boundary to avoid matching names like "Kevin"
  const kSuffixMatch = msg.match(/\b([0-9,]+(?:\.[0-9]+)?)\s*[kK](?!\w)/)
  if (kSuffixMatch) {
    return Number.parseFloat(kSuffixMatch[1].replace(/,/g, "")) * 1000
  }

  return null
}

function extractPurpose(allLines: string[], currentLineIndex: number, currentMessage: string): string {
  // Look at the next line for purpose information
  if (currentLineIndex + 1 < allLines.length) {
    const nextLine = allLines[currentLineIndex + 1].trim()
    // If next line contains purpose-related keywords, use it
    if (nextLine && /hive|material|labour|labor|fee|deposit|payment|cost|expense/i.test(nextLine)) {
      return nextLine
    }
  }

  // If not found in next line, return the message itself as purpose
  return currentMessage
}

function detectTransactionType(text: string): string {
  if (/bank|transfer|deposit|swift|wire/i.test(text)) return "Bank Transfer"
  if (/M-PESA|MPESA|mpesa/i.test(text)) return "M-PESA"
  if (/worldremit|remitly|wise|xoom|money gram/i.test(text)) return "Remittance"
  if (/card|credit/i.test(text)) return "Card Transaction"
  if (/cheque/i.test(text)) return "Cheque"
  return "Transaction"
}

function extractCodeFromText(text: string): string | null {
  const match = text.match(/\b([A-Z0-9]{8,12})\b/)
  return match ? match[1] : null
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

  // Look for "sent to [NAME]" stopping before: commas, digits (0...), "on", or line end
  const sentToMatch = msg.match(/sent\s+to\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|\s+on\b|\s*$)/i)
  if (sentToMatch) {
    paidTo = sentToMatch[1].trim()
  }

  const receivedFromMatch = msg.match(/received\s+from\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|\s+on\b|\s*$)/i)
  if (receivedFromMatch) {
    paidBy = receivedFromMatch[1].trim()
  }

  const paidToMatch = msg.match(/paid\s+to\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|\s+on\b|\s*$)/i)
  if (paidToMatch) {
    paidTo = paidToMatch[1].trim()
  }

  // Clean up extra whitespace and handle edge cases
  paidTo = paidTo.replace(/\s+/g, " ").trim()
  paidBy = paidBy.replace(/\s+/g, " ").trim()

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

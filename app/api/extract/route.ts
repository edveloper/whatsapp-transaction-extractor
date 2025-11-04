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

function detectTelegramTransactionType(line: string): string {
  if (/sent|paid/i.test(line)) return "Sent"
  if (/received/i.test(line)) return "Received"
  return "Other"
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

  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2})[,\s]*(\d{1,2}:\d{2}(?::\d{2})?)?/g

  const lines = text.split("\n")
  let currentMessage = ""
  let currentDate = ""

  for (const line of lines) {
    if (!line.trim() || line.startsWith("Telegram export") || line.startsWith("=")) continue

    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2}).+?(\d{1,2}:\d{2})/)
    if (dateMatch) {
      currentDate = dateMatch[0]
    }

    if (/amount|ksh|usd|transfer|sent|received|paid|cash/i.test(line)) {
      currentMessage += line + " "

      const amount = extractAmount(line)
      const reference = extractCode(line)

      if (amount && currentDate) {
        const transaction: Transaction = {
          Date: currentDate,
          Amount: amount,
          Type: detectTelegramTransactionType(line),
          Reference: reference || "TG",
          "Paid By": extractTelegramUser(text, currentDate) || "Telegram User",
          "Paid To": "",
          Purpose: currentMessage.trim(),
        }

        records.push(transaction)
        currentMessage = ""
      }
    }
  }

  return records
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
  const dateRegex = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/
  const amountRegex = /(?:Amount|Debit|Credit|\.?)[\s:]*(?:KES|KSH|USD|EUR)?[\s]*([0-9,]+(?:\.[0-9]{2})?)/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const dateMatch = line.match(dateRegex)
    const amountMatch = line.match(amountRegex)

    if (dateMatch && amountMatch) {
      const transaction: Transaction = {
        Date: dateMatch[1],
        Amount: Number.parseFloat(amountMatch[1].replace(/,/g, "")),
        Type: "Bank Statement",
        Reference: extractCode(line) || "PDF",
        "Paid By": "Bank",
        "Paid To": "",
        Purpose: line.trim(),
      }

      records.push(transaction)
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

  const pattern =
    /(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2})\s*(?:in the (?:morning|afternoon)|at night)?\s*-\s*([^:]+):\s*(.*)/g

  let match
  while ((match = pattern.exec(text)) !== null) {
    const [, date, time, sender, message] = match
    const cleanedMessage = cleanMessage(message)

    if (/Ksh|KES|cash|WorldRemit|I&M|Equity|paid to|sent to|Confirm|Confirmed/i.test(cleanedMessage)) {
      let transaction: Partial<Transaction> = {}

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

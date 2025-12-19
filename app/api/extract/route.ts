import { type NextRequest, NextResponse } from "next/server"

// --- Configuration for large file handling ---
export const maxDuration = 300 // 5 minutes timeout

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
}

// --- Interfaces ---

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

// Internal interface for structured WhatsApp parsing
interface ChatMessage {
  date: Date | string
  sender: string
  content: string
  originalString: string
}

// --- Main API Handler ---

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

    // Check file size
    if (file.size > 50000000) { // 50MB
      return NextResponse.json({ 
        error: "File too large. Maximum 50MB." 
      }, { status: 413 })
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
      // Default to WhatsApp (Updated Logic)
      const text = await file.text()
      
      // DEBUG: Log detected format
      console.log("[WhatsApp Parser] Detected format:", detectWhatsAppFormat(text))
      
      transactions = extractWhatsAppTransactions(text)
      
      // DEBUG: Log extraction results
      console.log(`[WhatsApp Parser] Extracted ${transactions.length} transactions`)
    }

    return NextResponse.json({ transactions, count: transactions.length })
  } catch (error) {
    console.error("[v0] Extraction error:", error)
    return NextResponse.json({ 
      error: "Failed to process file",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// --- 1. WhatsApp Extraction Logic (UPDATED) ---

function extractWhatsAppTransactions(text: string): Transaction[] {
  const records: Transaction[] = []
  
  // Step 1: Normalize text into Message Objects
  const messages = parseChatToObjects(text)
  
  console.log(`[WhatsApp Parser] Parsed ${messages.length} messages from chat`)

  // Step 2: Iterate through objects
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    
    // Cleanup: Remove invisible chars and excessive whitespace
    const cleanContent = msg.content
      .replace(/[\u200B\u200E\u200F]/g, "") // Remove formatting chars
      .replace(/\s+/g, " ")
      .trim()

    // GATEKEEPER: Updated check for transaction keywords
    const isTransaction = 
      /Ksh|KES|USD|\d+[kK]\b|sent to|paid to|received from|deposited to|Confirmed\.|given to|successfully transferred|has been (?:received|credited|debited)|credited to|debited with/i.test(cleanContent)

    if (!isTransaction) continue

    // Step 3: Extract Amount (FIXED VERSION)
    const amount = extractFlexibleAmount(cleanContent)
    if (!amount) continue // Skip if no valid amount found

    // Step 4: Extract Metadata
    const reference = extractCode(cleanContent) || "MANUAL"
    const [paidBy, paidTo] = extractEntities(cleanContent, msg.sender)
    
    // Step 5: Determine Type
    let type = "Other"
    if (/M-PESA|MPESA/i.test(cleanContent)) type = "M-PESA"
    else if (/Equity|KCB|Co-op|Bank|I&M|DTB|NCBA|Amica|Cooperative|Pesalink/i.test(cleanContent)) type = "Bank Transfer"
    else if (/WorldRemit|Remitly|Wise/i.test(cleanContent)) type = "Remittance"
    else if (/\bcash\b|hand|given/i.test(cleanContent)) type = "Cash"

    // Step 6: Context/Purpose
    const nextMsgContent = messages[i + 1]?.content
    let purpose = extractPurposeFromContext(cleanContent, nextMsgContent)

    records.push({
      Date: msg.date.toString(),
      Amount: amount,
      Type: type,
      Reference: reference,
      "Paid By": paidBy,
      "Paid To": paidTo,
      Purpose: purpose,
    })
  }

  return records
}

// UPDATED: Now handles multiple WhatsApp export formats
function parseChatToObjects(text: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  
  // MULTIPLE REGEX PATTERNS for different WhatsApp export formats
  // Format 1: DD/MM/YYYY, HH:MM AM/PM - Sender: Message
  const format1 = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}.*?)\s*-\s*(.*?):\s*/
  
  // Format 2: [DD/MM/YYYY, HH:MM:SS] Sender: Message
  const format2 = /^\[(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2}:\d{2})\]\s*(.*?):\s*/
  
  // Format 3: DD/MM/YY, HH:MM - Sender: Message (no seconds, 2-digit year)
  const format3 = /^(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2})\s*-\s*(.*?):\s*/

  const lines = text.split("\n")
  let currentMsg: Partial<ChatMessage> | null = null
  let bufferContent: string[] = []

  for (const line of lines) {
    // Try each format
    let match = line.match(format1) || line.match(format2) || line.match(format3)
    
    if (match) {
      // Push previous message to array
      if (currentMsg) {
        currentMsg.content = bufferContent.join("\n")
        messages.push(currentMsg as ChatMessage)
      }

      // Start new message
      const [_, dateStr, timeStr, sender] = match
      
      // Extract content (everything after the sender name)
      const contentStart = line.substring(match[0].length)
      
      bufferContent = [contentStart]
      currentMsg = {
        date: formatDateTime(dateStr, timeStr),
        sender: sender.trim(), // Clean sender name
        originalString: line
      }
    } else {
      // It's a continuation line (or a system message without a timestamp)
      if (currentMsg) {
        bufferContent.push(line)
      }
    }
  }

  // Push the final message
  if (currentMsg) {
    currentMsg.content = bufferContent.join("\n")
    messages.push(currentMsg as ChatMessage)
  }

  return messages
}

// FIXED: Now handles edge cases like "Ksh. 31500.0" and "KES249999.0"
function extractFlexibleAmount(text: string): number | null {
  // 1. Try informal "k" notation (e.g., 90k, 10.5K)
  const kMatch = text.match(/(?:\b|\s|^)(\d+(?:\.\d+)?)[kK](?:\b|\s|$)/)
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000
  }

  // 2. CONTEXT-AWARE EXTRACTION (PRIORITY!)
  // This catches "sent Ksh. 31500.0" where there's a period after Ksh
  const contextPatterns = [
    // NEW: SMS notification format - "Ksh 11000.00 sent" or "KES 14000 on your"
    /(?:Ksh|KES|USD|GBP|EUR)\.?\s+([0-9,]+(?:\.[0-9]+)?)\s+(?:sent|received|has been|drawn|credited|debited|made for)/i,
  
    // NEW: SMS format without space - "KES14000 on" or "KES63000 VIA"
    /(?:Ksh|KES|USD|GBP|EUR)([0-9,]+(?:\.[0-9]+)?)\s+(?:on|has|VIA|for)/i,
  
    // EXISTING: Chat format - "sent Ksh. 31500.0"
    /(?:sent|received|transferred|paid|deposited|credited|debited|withdrawn)\s+(?:Ksh|KES|USD|GBP|EUR)\.?\s*([0-9,]+(?:\.[0-9]+)?)/i,
  ]

  for (const pattern of contextPatterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ""))
      // Additional validation: Must be reasonable transaction amount
      if (amount >= 1 && amount <= 100000000) {
        return amount
      }
    }
  }

  // 3. Try STRICT currency patterns with MORE FLEXIBILITY
  // Pattern A: Prefix with optional space/period (Ksh 1000, Ksh.1000, KES249999.0)
  const prefixMatch = text.match(/(?:Ksh|KES|USD|GBP|EUR|UGX|TZS)\.?\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]+)?)/i)
  if (prefixMatch) {
    const amount = parseFloat(prefixMatch[1].replace(/,/g, ""))
    // Sanity check: Amount should be reasonable (not a year like 2025)
    if (amount >= 1 && amount <= 100000000) {
      return amount
    }
  }

  // Pattern B: Suffix (1000/=, 1000 Ksh, 31500.0 to)
  const suffixMatch = text.match(/([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]+)?)\s*(?:Ksh|KES|\/-|KSH|to|from)/i)
  if (suffixMatch) {
    const amount = parseFloat(suffixMatch[1].replace(/,/g, ""))
    if (amount >= 1 && amount <= 100000000) {
      return amount
    }
  }

  // 4. More context patterns for "Ksh. AMOUNT to" format
  const toPatterns = [
    // "Ksh. 31500.0 to" or "KES 31500.0 sent"
    /(?:Ksh|KES|USD|GBP|EUR)\.?\s+([0-9]+(?:\.[0-9]+)?)\s+(?:to|sent|from|paid|for)/i,
  ]

  for (const pattern of toPatterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ""))
      if (amount >= 1 && amount <= 100000000) {
        return amount
      }
    }
  }

  // 5. FALLBACK: Look for standalone currency amounts with decimal points
  // But ONLY if they're clearly not phone numbers or reference codes
  const decimalAmountMatch = text.match(/(?:Ksh|KES|USD|GBP|EUR)\.?\s+([0-9]+\.[0-9]+)/i)
  if (decimalAmountMatch) {
    const amount = parseFloat(decimalAmountMatch[1])
    // Phone numbers don't have meaningful decimal parts (like .0 or .00)
    // Transaction amounts often do (31500.0, 249999.0)
    if (amount >= 1 && amount <= 100000000) {
      return amount
    }
  }

  return null
}

function extractPurposeFromContext(currentContent: string, nextContent: string | undefined): string {
  // Priority 1: Look for "for [purpose]" in the current message
  const forMatch = currentContent.match(/\bfor\s+(.+?)(?:\.|$)/i)
  if (forMatch && forMatch[1].length > 3) {
    return forMatch[1].trim()
  }

  // Priority 2: Check next message
  if (nextContent) {
    const cleanNext = nextContent.trim()
    // If next message is a transaction, it's NOT a purpose
    const isNextTrans = /sent to|paid to|received|Ksh|KES/i.test(cleanNext)
    // If next message is reasonably short, treat it as a purpose label
    const isShortNote = cleanNext.length < 150 
    
    // Keywords that strongly suggest a purpose
    const hasKeywords = /labour|labor|material|cement|sand|transport|fee|deposit|allowance|fuel|hives/i.test(cleanNext)

    if (!isNextTrans && (isShortNote || hasKeywords)) {
      return cleanNext
    }
  }

  // Fallback
  return "General / See Reference"
}

// --- 2. Custom Template Extraction ---

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

// --- 3. Telegram Extraction ---

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
        const transactionType = detectTransactionType(line)

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

// --- 4. PDF Extraction ---

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

// --- 5. Email Extraction ---

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

// --- 6. Shared Helpers ---

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

function extractPaybillDestination(msg: string): { destination: string; account: string; } | null {
  // Pattern 1: Confirmed, Bill payment to [NAME] ... for account [NUMBER]
  const billPaymentMatch = msg.match(
    /(?:Bill payment to|sent to|paid to)\s*([A-Z0-9\s&]+?(?:LIMITED|STORE|BANK|ACCOUNT)?)\s*(?:for account|account number|for acc)\s*([A-Z0-9]+)/i
  )
  
  if (billPaymentMatch) {
    const destination = billPaymentMatch[1].trim().replace(/\s+/g, ' ')
    const account = billPaymentMatch[2].trim()
    
    // Clean up destination name (remove redundant Paybill Account)
    const cleanedDestination = destination
        .replace(/Paybill Account/i, "")
        .replace(/Paybill/i, "")
        .trim()
        
    return { 
      destination: cleanedDestination, 
      account: account 
    }
  }

  // Pattern 2: paid to [NAME], [Paybill No] for account number [NUMBER]
  const paybillMatch = msg.match(
    /paid to\s*([A-Z0-9\s&]+?)\s*,\s*(\d+)\s*for account number\s*([A-Z0-9]+)/i
  )
  
  if (paybillMatch) {
    const destination = paybillMatch[1].trim().replace(/\s+/g, ' ')
    const account = paybillMatch[3].trim()
    return {
      destination: destination,
      account: account,
    }
  }

  return null
}

function detectTransactionType(text: string): string {
  if (/bank|transfer|deposit|swift|wire|pesalink/i.test(text)) return "Bank Transfer"
  if (/M-PESA|MPESA|mpesa/i.test(text)) return "M-PESA"
  if (/worldremit|remitly|wise|xoom|money gram/i.test(text)) return "Remittance"
  if (/card|credit/i.test(text)) return "Card Transaction"
  if (/cheque/i.test(text)) return "Cheque"
  return "Other"
}

function extractCodeFromText(text: string): string | null {
  const match = text.match(/\b([A-Z0-9]{8,12})\b/)
  return match ? match[1] : null
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

function extractEntities(msg: string, sender: string): [string, string] {
  // *** PRIORITY 1: Structured Paybill/Bank Transfer ***
  const structuredData = extractPaybillDestination(msg)
  if (structuredData) {
    // Format: "Equity - Account No: 0116382281"
    const paidTo = `${structuredData.destination} - Account No: ${structuredData.account}`
    return [sender, paidTo]
  }
  
  // *** PRIORITY 2: Peer-to-Peer/Simple Name Extraction (Original Logic) ***
  let paidBy = sender
  let paidTo = ""

  // Look for "sent to [NAME]" stopping before: commas, digits (0...), "on", or line end
  const sentToMatch = msg.match(/sent\s+to\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|\s+on\b|\s*$)/i)
  if (sentToMatch) {
    paidTo = sentToMatch[1].trim()
  }

  // Heuristic: "received from [NAME]"
  const receivedFromMatch = msg.match(/received\s+from\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|\s+on\b|\s*$)/i)
  if (receivedFromMatch) {
    paidBy = receivedFromMatch[1].trim()
  }

  // Heuristic: "paid to [NAME]"
  const paidToMatch = msg.match(/paid\s+to\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|\s+on\b|\s*$)/i)
  if (paidToMatch) {
    paidTo = paidToMatch[1].trim()
  }

  // Heuristic: "given to [NAME]"
  const givenToMatch = msg.match(/given\s+to\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|\s+on\b|\s*$)/i)
  if (givenToMatch) {
      paidTo = givenToMatch[1].trim()
  }
  
  // Clean up extra whitespace and handle fallback sender
  paidTo = paidTo.replace(/\s+/g, " ").trim()
  paidBy = paidBy.replace(/\s+/g, " ").trim()

  return [paidBy, paidTo]
}

// UPDATED: Now handles 24-hour time format
function formatDateTime(date: string, time: string): string {
  // Normalize informal time markers common in WhatsApp exports
  let cleanTime = time
    .replace("in the morning", "AM")
    .replace("in the afternoon", "PM")
    .replace("at night", "PM")
    .replace("in the evening", "PM")
    .replace(/[\s-]/g, " ")
    .trim()
  
  try {
    const dateParts = date.split(/[\/-]/)
    if (dateParts.length === 3) {
      let [d, m, y] = dateParts
      
      // Handle 2-digit years
      if (y.length === 2) {
        y = "20" + y
      }
      
      // Return ISO-ish format: YYYY-MM-DD HH:mm
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")} ${cleanTime}`
    }
    return `${date} ${cleanTime}`
  } catch {
    return `${date} ${cleanTime}`
  }
}

// DEBUG HELPER: Detect WhatsApp format
function detectWhatsAppFormat(text: string): string {
  const lines = text.split("\n")
  
  // Find first non-empty line
  const firstLine = lines.find(line => line.trim().length > 0) || ""
  
  if (/^\[/.test(firstLine)) {
    return "Format 2: [DD/MM/YYYY, HH:MM:SS] Sender: (24-hour time with square brackets)"
  }
  
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}.*?\s*-/.test(firstLine)) {
    return "Format 1: DD/MM/YYYY, HH:MM AM/PM - Sender: (12-hour time with descriptive periods)"
  }
  
  if (/^\d{1,2}\/\d{1,2}\/\d{2},\s*\d{1,2}:\d{2}\s*-/.test(firstLine)) {
    return "Format 3: DD/MM/YY, HH:MM - Sender: (2-digit year)"
  }
  
  return `Unknown format. First line: "${firstLine.substring(0, 100)}..."`
}
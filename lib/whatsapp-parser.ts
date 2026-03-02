export interface ParsedTransaction {
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
  Category?: string
  MerchantType?: string
  rawContent?: string
  confidence?: number
  sourcePattern?: string
}

export interface NormalizedWhatsAppMessage {
  date: string
  time: string
  sender: string
  content: string
}

interface CounterpartyDetails {
  "Paid To": string
  CounterpartyId: string
  CounterpartyPhone?: string
  CounterpartyAccount?: string
  CounterpartyPaybill?: string
  CounterpartyTill?: string
}

interface MatcherResult extends CounterpartyDetails {
  Amount: number
  Type: string
  Reference: string
  Purpose: string
  confidence: number
  sourcePattern: string
}

const MIN_TRANSACTION_AMOUNT = 10
const LOW_CONFIDENCE_THRESHOLD = 0.75
const HEADER_PATTERNS = [
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(.+?)\s+-\s+(.*?):\s*/,
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+([^\]]+)\]\s+(.*?):\s*/,
]
const MANUAL_HINTS = ["fuel", "labour", "labor", "materials", "material", "transport", "fare", "cash", "rent", "deposit", "paid", "payment", "machine", "repair", "welding", "pipes", "water", "crusher", "buckets", "oil", "grease", "salary", "wages", "fee", "hard-core", "hard core", "mercury", "padlocks", "hardware", "tiles", "airtime"]
const NEGATIVE_PHRASES = ["messages and calls are end-to-end encrypted", "created group", "added you", "updated the message timer", "turned off disappearing messages", "this message was deleted", "<media omitted>", "image omitted", "video omitted", "document omitted", "sticker omitted", "missed voice call", "missed video call", "video call", "voice call", "pinned a message", "no answer"]
const NEGATIVE_PATTERNS = [/^\s*=/, /^\s*total paid\b/i, /^\s*currently we have done a total/i, /^\s*we have now done a total/i, /^\s*running costs so far/i, /^\s*earnings so far/i, /^\s*noted!?$/i, /^\s*confirmed thanks\b/i, /^\s*confirmed reception\b/i, /^\s*thank you[, ]+.*confirm/i]

export function extractRawTransactions(text: string): ParsedTransaction[] {
  return normalizeWhatsAppMessages(text).map(extractTransactionFromMessage).filter((tx): tx is ParsedTransaction => tx !== null)
}

export function normalizeWhatsAppMessages(text: string): NormalizedWhatsAppMessage[] {
  const lines = text.split(/\r?\n/)
  let current: NormalizedWhatsAppMessage | null = null
  const messages: NormalizedWhatsAppMessage[] = []
  for (const line of lines) {
    const header = matchHeader(line)
    if (header) {
      if (current) messages.push(current)
      current = header
      continue
    }
    if (current) current.content += ` ${line}`
  }
  if (current) messages.push(current)
  return messages.map((m) => ({ ...m, time: sanitizeWhatsAppField(m.time), sender: sanitizeWhatsAppField(m.sender), content: m.content.trim() }))
}

function matchHeader(line: string): NormalizedWhatsAppMessage | null {
  const cleaned = line.replace(/^\u200e/, "")
  for (const pattern of HEADER_PATTERNS) {
    const match = cleaned.match(pattern)
    if (match) return { date: match[1], time: match[2], sender: match[3], content: cleaned.substring(match[0].length) }
  }
  return null
}

function extractTransactionFromMessage(message: NormalizedWhatsAppMessage): ParsedTransaction | null {
  const content = message.content.trim()
  if (!content || shouldIgnoreMessage(content)) return null
  const match =
    matchMpesaApp(content) ||
    matchMpesaLegacy(content) ||
    matchMpesaSuccess(content) ||
    matchMpesaCredit(content) ||
    matchAccountReceipt(content) ||
    matchAccountSentReceipt(content) ||
    matchBillPayment(content) ||
    matchBankTransfer(content) ||
    matchBankAccountTransfer(content) ||
    matchBankDeposit(content) ||
    matchBankDebit(content) ||
    matchNcbaTransfer(content) ||
    matchRemittance(content) ||
    matchManual(content)
  if (!match) return null
  return { Date: `${message.date} ${message.time}`, Amount: match.Amount, Type: match.Type, Reference: match.Reference, "Paid By": message.sender, "Paid To": match["Paid To"], CounterpartyId: match.CounterpartyId, CounterpartyPhone: match.CounterpartyPhone, CounterpartyAccount: match.CounterpartyAccount, CounterpartyPaybill: match.CounterpartyPaybill, CounterpartyTill: match.CounterpartyTill, Purpose: match.Purpose, rawContent: content, confidence: match.confidence, sourcePattern: match.sourcePattern }
}

function shouldIgnoreMessage(content: string): boolean {
  const normalized = normalizeText(content)
  if (NEGATIVE_PHRASES.some((p) => normalized.includes(p))) return true
  if (NEGATIVE_PATTERNS.some((p) => p.test(content))) return true
  if (/https?:\/\//i.test(content) && !/\b(?:ksh|kes|usd|eur|\d{1,3},\d{3})\b/i.test(content)) return true
  return false
}

function matchMpesaApp(content: string): MatcherResult | null {
  const m = content.match(/\b(?<ref>[A-Z0-9]{10})\b\s+Confirmed\.\s*(?<amount>[0-9,]+(?:\.\d{2})?)\s*KSH\s+(?<action>sent to|paid to)\s+(?<recipient>.+?)(?:\.\s| via M-PESA App|$)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "M-PESA", m.groups.ref, m.groups.recipient, summarizePurpose(content, m.groups.action), 0.98, "mpesa_app") : null
}

function matchMpesaLegacy(content: string): MatcherResult | null {
  const m = content.match(/\b(?<ref>[A-Z0-9]{10})\b\s+Confirmed\.\s*Ksh\s*(?<amount>[0-9,]+(?:\.\d{2})?)\s+(?<action>sent to|paid to)\s+(?<recipient>.+?)(?:\s+on\s+\d{1,2}\/\d{1,2}\/\d{2,4}|\.\s|$)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "M-PESA", m.groups.ref, m.groups.recipient, summarizePurpose(content, m.groups.action), 0.97, "mpesa_legacy") : null
}

function matchMpesaSuccess(content: string): MatcherResult | null {
  const m = content.match(/M-?Pesa payment of KES\s*(?<amount>[0-9,]+(?:\.\d{2})?)\s+to\s+(?<recipient>.+?)\s+was successful.*?M-?Pesa Ref:\s*(?<ref>[A-Z0-9]{10})/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "M-PESA", m.groups.ref, m.groups.recipient, summarizePurpose(content, "payment"), 0.98, "mpesa_success") : null
}

function matchMpesaCredit(content: string): MatcherResult | null {
  const m = content.match(/Your transaction of Kshs?\.?\s*(?<amount>[0-9,]+(?:\.\d+)?)\s+has been credited to\s+(?<phone>254\d{9}|0\d{9})\s+(?<recipient>.+?)\.\s*Ref\.?\s*(?<ref>[A-Z0-9]+)\.\s*MPESA Ref\.?\s*(?<mpesaRef>[A-Z0-9]+)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "M-PESA Receipt", m.groups.ref, `${m.groups.recipient} ${m.groups.phone}`, summarizePurpose(content, "credit"), 0.94, "mpesa_credit") : null
}

function matchAccountReceipt(content: string): MatcherResult | null {
  const m = content.match(/you have received KES\s*(?<amount>[0-9,]+(?:\.\d+)?)\s+MPESA ref:\s*(?<ref>[A-Z0-9]+)\s+to your account\s+(?<account>[A-Z0-9*]+)\s+from\s+(?<sender>.+?)(?:-\s*(?<phone>254\d{9}|0\d{9}))?$/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "Account Receipt", m.groups.ref, `${m.groups.sender} ${m.groups.phone || ""} account ${m.groups.account}`, summarizePurpose(content, "account receipt"), 0.95, "account_receipt") : null
}

function matchAccountSentReceipt(content: string): MatcherResult | null {
  const m = content.match(/Ksh\s*(?<amount>[0-9,]+(?:\.\d{2})?)\s+sent to\s+(?<bank>[A-Z\s]+)\s+account\s+(?<recipient>.+?)\s+(?<account>[A-Z0-9*]{4,20})\s+has been received.*?M-?PESA Ref\s*(?<ref>[A-Z0-9]+)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "Bank Transfer", m.groups.ref, `${m.groups.recipient} account ${m.groups.account}`, summarizePurpose(content, "account transfer"), 0.95, "account_transfer_receipt") : null
}

function matchBillPayment(content: string): MatcherResult | null {
  const m = content.match(/Confirmed\.?\s*(?:Payment|Bill payment)\s+of\s+Ksh\.?\s*(?<amount>[0-9,]+(?:\.\d{2})?)\s+to\s+(?<recipient>.+?)\((?<account>\d{4,16})\)\s+has been received\.\s*Ref:\s*(?<ref>[A-Z0-9]+)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "Bill Payment", m.groups.ref, `${m.groups.recipient} account ${m.groups.account}`, summarizePurpose(content, "bill payment"), 0.95, "bill_payment_received") : null
}

function matchBankTransfer(content: string): MatcherResult | null {
  const m = content.match(/successfully transferred KES\s*(?<amount>[0-9,]+(?:\.\d{2})?)\s+to\s+(?<recipient>.+?)\.\s*(?:M-?PESA Ref:\s*[A-Z0-9]{10}\.\s*)?Ref(?::| No:)\s*(?<ref>[A-Z0-9]+)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "Bank Transfer", m.groups.ref, m.groups.recipient, summarizePurpose(content, "bank transfer"), 0.96, "bank_transfer") : null
}

function matchBankAccountTransfer(content: string): MatcherResult | null {
  const m = content.match(/Transaction Ref:\s*(?<txnRef>\d+)\s+of\s+KES\s*(?<amount>[0-9,]+(?:\.\d{2})?)\s+from\s+A\/c\s+(?<from>[\d*]+)\s+to\s+A\/c\s+(?<to>[\d*]+).*?Bank Ref:\s*(?<ref>[A-Z0-9]+)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "Bank Transfer", m.groups.ref, `account ${m.groups.to}`, summarizePurpose(content, "completed bank transfer"), 0.96, "bank_account_transfer") : null
}

function matchBankDeposit(content: string): MatcherResult | null {
  const m = content.match(/Your transaction of KES\.?\s*(?<amount>[0-9,]+(?:\.\d{2})?)\s+has successfully been deposited to\s+(?<recipient>.+?)\.\.\.\s*Ref\.?\s*Number\s+(?<ref>[A-Z0-9]+)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "Bank Deposit", m.groups.ref, m.groups.recipient, summarizePurpose(content, "deposit"), 0.96, "bank_deposit") : null
}

function matchBankDebit(content: string): MatcherResult | null {
  const m = content.match(/(?:debited with|Debit has been made for)\s+KES\s*(?<amount>[0-9,]+(?:\.\d{2})?).*?(?:account|A\/c)\s*(?<account>[\dX*]+).*?(?:Ref[: ]\s*(?<ref>[A-Z0-9]+))?/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "Bank Debit", (m.groups.ref || "MANUAL-LOG").toUpperCase(), `account ${m.groups.account}`, summarizePurpose(content, "debit alert"), 0.9, "bank_debit") : null
}

function matchNcbaTransfer(content: string): MatcherResult | null {
  const m = content.match(/(?<amount>[0-9,]+(?:\.\d{2})?)\s+KES has been successfully sent to\s+(?<recipient>.+?)\s+(?<account>[\d*]+)\s+(?<bank>[A-Z][A-Z\s]+?)\.\s*Ref\.?\s*(?<ref>[A-Z0-9]+)/i)
  return m?.groups ? buildMatch(parseAmount(m.groups.amount), "Bank Transfer", m.groups.ref, `${m.groups.recipient} account ${m.groups.account}`, summarizePurpose(content, "bank transfer"), 0.95, "ncba_transfer") : null
}

function matchRemittance(content: string): MatcherResult | null {
  if (!/\b(worldremit|remitly|wise|pesalink|airtel money|airtel)\b/i.test(content)) return null
  return buildMatch(extractStrictAmount(content), inferTransferType(content), extractCode(content) || "MANUAL-LOG", content, summarizePurpose(content, "remittance"), 0.75, "remittance_or_alt_wallet")
}

function matchManual(content: string): MatcherResult | null {
  const normalized = normalizeText(content)
  if (!MANUAL_HINTS.some((hint) => normalized.includes(hint))) return null
  if (/\bconfirm receiving\b|\breceived\b|\breception confirmed\b/.test(normalized)) return null
  if (/\btotal\b/.test(normalized) && !/\bfor\b/.test(normalized)) return null
  const details = extractManualCounterpartyDetails(content)
  return buildMatch(extractStrictAmount(content), inferManualType(content), extractCode(content) || "MANUAL-LOG", details["Paid To"], summarizePurpose(content, "manual"), 0.62, "manual_ledger", details)
}

function buildMatch(amount: number | null, type: string, ref: string, recipient: string, purpose: string, confidence: number, sourcePattern: string, details?: CounterpartyDetails): MatcherResult | null {
  if (!amount) return null
  const counterparty = details || extractCounterpartyDetails(recipient)
  return { Amount: amount, Type: type, Reference: ref.toUpperCase(), Purpose: purpose, confidence, sourcePattern, ...counterparty }
}

export function extractStrictAmount(text: string): number | null {
  const patterns = [/(?:Ksh|KSH|KES\.?|KES)\s*[:.]?\s*([0-9,]+(?:\.\d{2})?)/i, /\b([0-9,]+(?:\.\d{2})?)\s*(?:KSH|KES|kshs|shs)\b/i, /\b([1-9]\d*(?:\.\d+)?)\s*k\b/i, /\b(?:sent|paid|deposited|transferred|payment of|for)\s+(?:KES\.?|Ksh|KSH)?\s*([0-9,]+(?:\.\d{2})?)/i, /\b([0-9]{1,3}(?:,\d{3})+(?:\.\d{2})?)\b/, /\b([1-9]\d{2,5})\b/]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    const value = pattern.source.includes("\\s*k\\b") ? parseAmountShorthand(match[1]) : parseAmount(match[1])
    if (value) return value
  }
  return null
}

export function extractCode(text: string): string | null {
  const patterns = [/\b(?:M-?Pesa Ref|Ref\.?\s*Number|Ref(?: No)?|Bank Ref|Transaction Ref):\s*([A-Z0-9]{8,40})\b/i, /\b([A-Z]{2,}[A-Z0-9]{6,})\b/]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].toUpperCase()
  }
  return null
}

export function sanitizeWhatsAppField(value: string): string {
  return value.replace(/^\u200e+/, "").replace(/\s*(?:in the|at)\s*(?:morning|afternoon|evening|night)\b/gi, "").replace(/\s*-\s*$/, "").trim()
}

function extractCounterpartyDetails(value: string): CounterpartyDetails {
  const cleaned = value.replace(/\u00a0/g, " ").replace(/\s+for\s+account.*$/i, "").replace(/\s{2,}/g, " ").trim()
  const phone = find(cleaned, [/\b(254\d{9}|0\d{9}|\d{3}\*{3}\d{3})\b/])
  const paybill = find(cleaned, [/\bpaybill(?: account)?\s*[:#,-]?\s*([A-Z0-9*]{4,20})\b/i])
  const till = find(cleaned, [/\b(?:till|till number)\s*[:#,-]?\s*([A-Z0-9*]{4,20})\b/i])
  const account = find(cleaned, [/\b(?:account(?: number)?|a\/c|acc(?:ount)?)\s*[:#,-]?\s*([A-Z0-9*]{4,30})\b/i, /\b([0-9*]{6,20})\b/])
  const display = cleaned.replace(/,?\s*(?:254\d{9}|0\d{9}|\d{3}\*{3}\d{3})\b.*$/i, "").replace(/\b(?:account(?: number)?|a\/c|acc(?:ount)?|paybill account|paybill|till(?: number)?)\s*[:#,-]?\s*[A-Z0-9*]{4,30}\b/gi, "").replace(/[(),]+/g, " ").replace(/\s{2,}/g, " ").trim()
  return { "Paid To": display || cleaned || "Resolving...", CounterpartyId: paybill || till || account || phone || "N/A", CounterpartyPhone: phone || undefined, CounterpartyAccount: account || undefined, CounterpartyPaybill: paybill || undefined, CounterpartyTill: till || undefined }
}

function extractManualCounterpartyDetails(content: string): CounterpartyDetails {
  const explicitRecipientPatterns = [
    /\b(?:sent to|paid to|deposited to|transferred to)\s+(.+?)(?:\.|,| on \d| via |$)/i,
    /\bto\s+([A-Z][A-Za-z0-9&.\- ]{2,})(?:\s+for\s+|\.\s*|$)/i,
  ]

  for (const pattern of explicitRecipientPatterns) {
    const match = content.match(pattern)
    if (match?.[1]) {
      return extractCounterpartyDetails(match[1])
    }
  }

  const identified = extractCounterpartyDetails(content)
  if (identified.CounterpartyId !== "N/A") {
    return {
      ...identified,
      "Paid To": identified["Paid To"] === content.trim() ? "" : identified["Paid To"],
    }
  }

  return {
    "Paid To": "",
    CounterpartyId: "Manual Entry",
  }
}

function find(value: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match?.[1] || match?.[0]) return (match[1] || match[0]).trim()
  }
  return null
}

function parseAmount(value: string | undefined): number | null {
  if (!value) return null
  const parsed = parseFloat(value.replace(/,/g, "").replace(/\/-$/, ""))
  return Number.isFinite(parsed) && parsed > MIN_TRANSACTION_AMOUNT ? parsed : null
}

function parseAmountShorthand(value: string | undefined): number | null {
  if (!value) return null
  const numeric = parseFloat(value.replace(/,/g, ""))
  if (!Number.isFinite(numeric)) return null
  const amount = numeric * 1000
  return amount > MIN_TRANSACTION_AMOUNT ? amount : null
}

function summarizePurpose(content: string, fallback: string): string {
  const lines = content.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean)
  const candidate = lines.find((line) => !/\bconfirmed\b/i.test(line) && !/\b(?:ref|transaction cost|balance|mpesa ref|bank ref)\b/i.test(line))
  return (candidate || fallback).slice(0, 120)
}

function inferTransferType(content: string): string {
  const normalized = normalizeText(content)
  if (normalized.includes("airtel")) return "Airtel Money"
  if (normalized.includes("pesalink")) return "Bank Transfer"
  if (/\b(worldremit|remitly|wise)\b/.test(normalized)) return "Remittance"
  return "Transfer"
}

function inferManualType(content: string): string {
  const normalized = normalizeText(content)
  return /\b(received|receipt|income|earnings)\b/.test(normalized) ? "Manual Income" : "Manual/Cash"
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").toLowerCase()
}

export function isLowConfidence(transaction: { confidence?: number; sourcePattern?: string }): boolean {
  return (transaction.confidence ?? 0) < LOW_CONFIDENCE_THRESHOLD || transaction.sourcePattern === "manual_ledger"
}

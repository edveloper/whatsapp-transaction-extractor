import test from "node:test"
import assert from "node:assert/strict"
import {
  dedupeTransactions,
  extractCode,
  extractRawTransactions,
  extractStrictAmount,
  isLowConfidence,
  normalizeWhatsAppMessages,
  sanitizeWhatsAppField,
} from "../lib/whatsapp-parser"

test("normalizes android-style WhatsApp exports", () => {
  const text = "07/05/2025, 9:09 in the morning - Mum KE: THI8U576G4 Confirmed. 10,115.00 KSH sent to Kenneth Ocholla"
  const [message] = normalizeWhatsAppMessages(text)

  assert.equal(message.date, "07/05/2025")
  assert.equal(message.time, "9:09")
  assert.equal(message.sender, "Mum KE")
})

test("normalizes bracketed WhatsApp exports", () => {
  const text = "[10/10/2025, 15:55:54] Ann M: Dear ELIZABETH, you have successfully transferred KES 156,000.00 to 1316682943. Ref: 0063000120251015082655094cf3e4."
  const [message] = normalizeWhatsAppMessages(text)

  assert.equal(message.date, "10/10/2025")
  assert.equal(message.time, "15:55:54")
  assert.equal(message.sender, "Ann M")
})

test("extracts M-PESA app style confirmations", () => {
  const text = "28/08/2025, 4:10 in the afternoon - Mum KE: THS4C36FFS Confirmed. 12,500.00 KSH sent to Kenneth Ocholla, 0748***180 via M-PESA App."
  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "M-PESA")
  assert.equal(transaction.Reference, "THS4C36FFS")
  assert.equal(transaction.Amount, 12500)
  assert.equal(transaction["Paid To"], "Kenneth Ocholla")
  assert.equal(transaction.CounterpartyId, "0748***180")
  assert.equal(transaction.sourcePattern, "mpesa_app")
  assert.equal(transaction.CounterpartyPhone, "0748***180")
})

test("extracts legacy M-PESA confirmations with multiline purpose", () => {
  const text = [
    "18/08/2025, 11:04 in the morning - Mum KE: TH91LHX8G1 Confirmed. Ksh3,000.00 sent to Kenneth  Ocholla 0748015180 on 9/8/25 at 1:39 PM.",
    "",
    "MATERIAL AND LABOUR FOR FIRST TWO HIVES",
  ].join("\n")

  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Reference, "TH91LHX8G1")
  assert.equal(transaction.Amount, 3000)
  assert.equal(transaction["Paid To"], "Kenneth Ocholla")
  assert.equal(transaction.CounterpartyId, "0748015180")
  assert.match(transaction.Purpose, /MATERIAL AND LABOUR/i)
  assert.equal(transaction.sourcePattern, "mpesa_legacy")
  assert.equal(transaction.CounterpartyPhone, "0748015180")
})

test("extracts bank transfer alerts from bracketed chats", () => {
  const text =
    "[15/10/2025, 08:27:40] Liz: Dear ELIZABETH, you have successfully transferred KES 156,000.00 to 1316682943. Ref: 0063000120251015082655094cf3e4. Ref No: 404209644."

  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "Bank Transfer")
  assert.equal(transaction.Amount, 156000)
  assert.equal(transaction.Reference, "0063000120251015082655094CF3E4")
  assert.equal(transaction["Paid To"], "1316682943")
  assert.equal(transaction.CounterpartyId, "1316682943")
  assert.equal(transaction.sourcePattern, "bank_transfer")
})

test("extracts bank deposit alerts", () => {
  const text =
    "24/02/2024, 1:51 in the afternoon - Dad KE: Dear SIMON ALEXANDER MARK DANIELL, Your transaction of KES. 250,000.00 has successfully been deposited to Equity Account in favor of ABYSSINIA IRON AND STEEL LIMIT... Ref. Number SBO11TTJK3 on 24-02-2024 at 13:51. Thank you."

  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "Bank Deposit")
  assert.equal(transaction.Amount, 250000)
  assert.equal(transaction.Reference, "SBO11TTJK3")
  assert.equal(transaction["Paid To"], "ABYSSINIA IRON AND STEEL LIMIT")
  assert.equal(transaction.CounterpartyId, "N/A")
})

test("extracts paybill and account identifiers separately", () => {
  const text =
    "25/07/2025, 12:15 in the afternoon - Mum KE: TGP8FIUFD2 Confirmed. 72,000.00 KSH paid to Equity Paybill Account, 247247 for account number 0116382281 via M-PESA App."

  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.CounterpartyPaybill, "247247")
  assert.equal(transaction.CounterpartyAccount, "0116382281")
  assert.equal(transaction.CounterpartyId, "247247")
})

test("extracts completed account-to-account transfers", () => {
  const text =
    "[02/10/2025, 13:15:55] Ann M: Dear ANN WANJUHI MUHIA, Transaction Ref: 20068102457 of KES 2,500,000.00 from A/c 1*****2943 to A/c 1*****4206 on 02/10/2025 is Completed Bank Ref: FT252751MMVJ."

  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "Bank Transfer")
  assert.equal(transaction.CounterpartyAccount, "1*****4206")
  assert.equal(transaction.CounterpartyId, "1*****4206")
  assert.equal(transaction.Reference, "FT252751MMVJ")
})

test("extracts credited transaction receipts", () => {
  const text =
    "Your transaction of Kshs. 100000.0 has been credited to 254723606519 ANTHONY NDICHU. Ref. EQX1AEF3D7B2878. MPESA Ref. THU6LO09A2 on 30/08/2025 at 13:16:43."

  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "M-PESA Receipt")
  assert.equal(transaction.CounterpartyPhone, "254723606519")
  assert.equal(transaction.CounterpartyId, "254723606519")
  assert.equal(transaction.Reference, "EQX1AEF3D7B2878")
})

test("extracts received-to-account notifications", () => {
  const text =
    "[28/10/2025, 14:20:17] Ann M: Dear TETRA ZUS LTD, you have received KES249999.0 MPESA ref: TJSHB8NLXW to your account XX7333 from ANN W MUHIA- 254719736620"

  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "Account Receipt")
  assert.equal(transaction.CounterpartyAccount, "XX7333")
  assert.equal(transaction.CounterpartyPhone, "254719736620")
  assert.equal(transaction.CounterpartyId, "XX7333")
})

test("extracts account receipt confirmations sent to bank accounts", () => {
  const text =
    "05/11/2025, 10:56 in the morning - Mum KE: Ksh 2450.00 sent to KCB account OJWANGOKOTO 6024665 has been received on 05/11/2025 at 10:55 AM. M-PESA Ref TK58898B8H."

  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "Bank Transfer")
  assert.equal(transaction.CounterpartyAccount, "6024665")
  assert.equal(transaction.CounterpartyId, "6024665")
  assert.equal(transaction.Reference, "TK58898B8H")
})

test("extracts manual ledger notes with explicit expense context", () => {
  const text = "29/04/2025, 7:39 in the morning - Mum KE: Buckets 8000"
  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "Manual/Cash")
  assert.equal(transaction.Amount, 8000)
  assert.equal(transaction.Reference, "MANUAL-LOG")
  assert.equal(transaction.CounterpartyId, "Manual Entry")
  assert.equal(transaction.sourcePattern, "manual_ledger")
})

test("ignores running totals and non-transaction acknowledgements", () => {
  const text = [
    "23/10/2025, 17:19:39 - Liz: =710,000+42,000+4,800=756,800",
    "22/02/2024, 2:28 in the afternoon - +254 729 863103: Thank you, I confirm receiving 107,000ksh.",
  ].join("\n")

  assert.equal(extractRawTransactions(text).length, 0)
})

test("extractStrictAmount handles KES, KSH and plain manual note amounts", () => {
  assert.equal(extractStrictAmount("Ksh2,500.00 sent to Kenneth"), 2500)
  assert.equal(extractStrictAmount("10,115.00 KSH sent to Kenneth"), 10115)
  assert.equal(extractStrictAmount("Buckets 8000"), 8000)
  assert.equal(extractStrictAmount("206k taken from the 500k unit trust liquidated"), 206000)
  assert.equal(extractStrictAmount("Need 10k for fuel"), 10000)
})

test("extractCode supports long bank refs and standard mobile-money refs", () => {
  assert.equal(extractCode("Ref: 0063000120251015082655094cf3e4"), "0063000120251015082655094CF3E4")
  assert.equal(extractCode("M-Pesa Ref: SBN6WPKEYG"), "SBN6WPKEYG")
})

test("sanitizeWhatsAppField removes verbose time suffixes and direction marks", () => {
  assert.equal(sanitizeWhatsAppField("9:09 in the morning"), "9:09")
  assert.equal(sanitizeWhatsAppField("\u200eMum KE - "), "Mum KE")
})

test("manual ledger matches are flagged as low confidence", () => {
  const [transaction] = extractRawTransactions("29/04/2025, 7:39 in the morning - Mum KE: Buckets 8000")
  assert.equal(isLowConfidence(transaction), true)
})

test("running-total continuation lines don't get merged into the previous message's amount", () => {
  const text = [
    "[11/10/2025, 13:20:41] Liz: Loan from fuel",
    "=710,000+42,000+4,800=756,800",
    "[11/10/2025, 13:25:00] Liz: KES 5,000 sent to John Doe via Pesalink",
  ].join("\n")

  const transactions = extractRawTransactions(text)
  assert.ok(!transactions.some((t) => t.Amount === 710000), "the running-total formula must not be recorded as a transaction")
})

test("MANUAL_HINTS match whole words only, not substrings of unrelated words", () => {
  assert.equal(extractRawTransactions("21/10/2025, 09:00 in the morning - Liz: Yeah, it fitted the market price well, but that's different").length, 0)
  assert.equal(extractRawTransactions("21/10/2025, 09:00 in the morning - Liz: Let's grab coffee and catch up later").length, 0)
})

test("narrative and hypothetical phrasing is not recorded as a manual transaction", () => {
  assert.equal(extractRawTransactions("21/10/2025, 09:00 in the morning - Liz: Would 200k be too much in current state?").length, 0)
  assert.equal(extractRawTransactions("21/10/2025, 09:00 in the morning - Liz: Okay, keep me posted cuz he paid back the 304k").length, 0)
  assert.equal(extractRawTransactions("21/10/2025, 09:00 in the morning - Liz: Hey pal, can you check if you made a deposit of 800k").length, 0)
})

test("multi-item cost breakdowns use the author's stated total, not the first line item", () => {
  const [transaction] = extractRawTransactions(
    "21/10/2025, 09:00 in the morning - Liz: September site - Labour 170,000 + Material 840,000 = 1,010,000",
  )
  assert.equal(transaction.Amount, 1010000)
})

test("extractCounterpartyDetails doesn't split a bare 'Account' into a fake account number", () => {
  const [transaction] = extractRawTransactions(
    "21/10/2025, 09:00 in the morning - Dad KE: Dear JOHN DOE, Your transaction of KES. 150,000.00 has successfully been deposited to Equity Account in favor of ACME SUPPLIES LTD... Ref. Number SB012345XY on 21-10-2025 at 09:00. Thank you.",
  )
  assert.notEqual(transaction.CounterpartyId, "ount")
})

test("extractCode finds a labeled reference even without a colon", () => {
  assert.equal(extractCode("Ref  SFQ8NXETMM. Thank you."), "SFQ8NXETMM")
})

test("dedupeTransactions collapses only same reference+amount, not coincidental same-day/same-amount transactions", () => {
  const base = { Date: "15/05/2024 08:21", "Paid By": "Dad KE", "Paid To": "ACME LTD", CounterpartyId: "78777", Purpose: "payment" }
  const sameTxReportedTwice = [
    { ...base, Amount: 102000, Type: "M-PESA", Reference: "SEF6CUF464" },
    { ...base, Amount: 102000, Type: "M-PESA", Reference: "SEF6CUF464" },
  ]
  assert.equal(dedupeTransactions(sameTxReportedTwice).length, 1)

  const distinctSameDayAndAmount = [
    { ...base, Date: "09/04/2024 11:12", Amount: 150000, Type: "Bank Deposit", Reference: "SD99M7GRWZ" },
    { ...base, Date: "09/04/2024 12:53", Amount: 150000, Type: "Bank Deposit", Reference: "SD95M92X3L" },
  ]
  assert.equal(dedupeTransactions(distinctSameDayAndAmount).length, 2)
})

test("extracts KRA E-Slip tax payment confirmations", () => {
  const text =
    "09/09/2024, 11:13 in the morning - Ann M: Dear Kenya Revenue Authority, we confirm your Payment Ref: LPRBVPGY for E-Slip No. 2020240003070626 of KES 5250.00 has been received on 2024-9-9 11:11:58 AM by KRA."
  const [transaction] = extractRawTransactions(text)

  assert.equal(transaction.Type, "Tax Payment")
  assert.equal(transaction.Amount, 5250)
  assert.equal(transaction.Reference, "LPRBVPGY")
  assert.equal(transaction["Paid To"], "Kenya Revenue Authority")
  assert.equal(transaction.sourcePattern, "kra_eslip")
})

test("remittance messages stating an unconverted foreign-currency amount are flagged low-confidence, not silently read as KES", () => {
  const text = "21/10/2025, 09:00 in the morning - Liz: TX123ABCDE confirmed. You sent USD 500 to John Doe via Wise on 21/10/25."
  const [transaction] = extractRawTransactions(text)

  assert.match(transaction.Type, /verify currency/)
  assert.equal(isLowConfidence(transaction), true)
})

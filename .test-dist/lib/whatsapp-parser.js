"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRawTransactions = extractRawTransactions;
exports.extractStrictAmount = extractStrictAmount;
exports.extractCode = extractCode;
exports.sanitizeWhatsAppField = sanitizeWhatsAppField;
const WHATSAPP_HEADER_PATTERN = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP]\.?[mM]\.?)?.*?)\s+-\s+(.*?):\s*/;
function extractRawTransactions(text) {
    const records = [];
    const lines = text.split("\n");
    let currentMsg = null;
    const messages = [];
    for (const line of lines) {
        const match = line.match(WHATSAPP_HEADER_PATTERN);
        if (match) {
            if (currentMsg)
                messages.push(currentMsg);
            currentMsg = { date: match[1], time: match[2], sender: match[3], content: line.substring(match[0].length) };
            continue;
        }
        if (currentMsg) {
            currentMsg.content += ` ${line}`;
        }
    }
    if (currentMsg)
        messages.push(currentMsg);
    for (const message of messages) {
        const content = message.content.trim();
        const amount = extractStrictAmount(content);
        if (!amount)
            continue;
        records.push({
            Date: `${message.date} ${sanitizeWhatsAppField(message.time)}`,
            Amount: amount,
            Type: content.includes("Confirmed") ? "M-PESA" : "Manual/Cash",
            Reference: extractCode(content) || "MANUAL-LOG",
            "Paid By": sanitizeWhatsAppField(message.sender),
            "Paid To": "Resolving...",
            Purpose: content.substring(0, 80),
            rawContent: content,
        });
    }
    return records;
}
function extractStrictAmount(text) {
    const match = text.match(/(?:Ksh|KSH|Confirmed\.?|sent)\s*([0-9,]+(?:\.\d{2})?)/i) ||
        text.match(/\b(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)\b/);
    if (!match)
        return null;
    const value = parseFloat(match[1].replace(/,/g, ""));
    return value > 10 ? value : null;
}
function extractCode(text) {
    const match = text.match(/\b([A-Z0-9]{10})\b/);
    return match ? match[0] : null;
}
function sanitizeWhatsAppField(value) {
    return value.replace(/\s*(?:in the|at)\s*(?:morning|afternoon|evening|night)\b/gi, "").replace(/[-\s]+$/g, "").trim();
}

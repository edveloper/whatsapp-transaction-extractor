"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const whatsapp_parser_1 = require("../lib/whatsapp-parser");
(0, node_test_1.default)("extracts M-PESA transaction details from a WhatsApp export line", () => {
    const text = "12/1/2026, 8:45 pm - John Doe: Confirmed. Ksh12,500.00 sent to Jane Doe. Ref ABCD123456 balance is 500";
    const [transaction] = (0, whatsapp_parser_1.extractRawTransactions)(text);
    strict_1.default.equal(transaction.Date, "12/1/2026 8:45 pm");
    strict_1.default.equal(transaction.Amount, 12500);
    strict_1.default.equal(transaction.Type, "M-PESA");
    strict_1.default.equal(transaction.Reference, "ABCD123456");
    strict_1.default.equal(transaction["Paid By"], "John Doe");
    strict_1.default.equal(transaction["Paid To"], "Resolving...");
});
(0, node_test_1.default)("joins multiline messages before parsing purpose and amount", () => {
    const text = [
        "12/1/2026, 8:45 pm - John Doe: Sent Ksh 2,500 for transport",
        "Please confirm once received",
    ].join("\n");
    const [transaction] = (0, whatsapp_parser_1.extractRawTransactions)(text);
    strict_1.default.equal(transaction.Amount, 2500);
    strict_1.default.match(transaction.Purpose, /transport Please confirm once received/);
    strict_1.default.match(transaction.rawContent || "", /Please confirm once received/);
});
(0, node_test_1.default)("sanitizes verbose WhatsApp time and sender suffixes", () => {
    strict_1.default.equal((0, whatsapp_parser_1.sanitizeWhatsAppField)("8:45 pm in the evening"), "8:45 pm");
    strict_1.default.equal((0, whatsapp_parser_1.sanitizeWhatsAppField)("John Doe at night - "), "John Doe");
});
(0, node_test_1.default)("ignores messages without a meaningful transaction amount", () => {
    const text = [
        "12/1/2026, 8:45 pm - John Doe: Meeting starts at 8pm",
        "12/1/2026, 9:00 pm - John Doe: Sent Ksh 5 for airtime",
    ].join("\n");
    strict_1.default.equal((0, whatsapp_parser_1.extractRawTransactions)(text).length, 0);
});
(0, node_test_1.default)("falls back to MANUAL-LOG when no reference code is present", () => {
    const text = "12/1/2026, 8:45 pm - John Doe: Sent Ksh 500 to site worker for labour";
    const [transaction] = (0, whatsapp_parser_1.extractRawTransactions)(text);
    strict_1.default.equal(transaction.Reference, "MANUAL-LOG");
    strict_1.default.equal(transaction.Type, "Manual/Cash");
});
(0, node_test_1.default)("extractStrictAmount prefers amount tokens over unrelated digits", () => {
    strict_1.default.equal((0, whatsapp_parser_1.extractStrictAmount)("Ref ABC1234567 Confirmed Ksh 1,200.00"), 1200);
    strict_1.default.equal((0, whatsapp_parser_1.extractStrictAmount)("Invoice 2025 total 1,200.00"), 1200);
});
(0, node_test_1.default)("extractCode returns only 10-character alphanumeric codes", () => {
    strict_1.default.equal((0, whatsapp_parser_1.extractCode)("Reference is ABCD123456 for the payment"), "ABCD123456");
    strict_1.default.equal((0, whatsapp_parser_1.extractCode)("Reference is TOO-LONG-123456"), null);
});

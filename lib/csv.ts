// Values starting with these characters are interpreted as formulas by Excel/Sheets when a CSV
// is opened, which is a known injection vector for data that ultimately comes from free-text
// WhatsApp messages. Prefixing with a single quote neutralizes the formula without altering the
// visible value (the standard OWASP-recommended mitigation).
const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@", "\t", "\r"]

function sanitizeCsvField(value: unknown): string {
  const stringValue = String(value || "")
  const safeValue = FORMULA_TRIGGER_CHARS.some((char) => stringValue.startsWith(char)) ? `'${stringValue}` : stringValue
  return safeValue.includes(",") || safeValue.includes('"') || safeValue.includes("\n")
    ? `"${safeValue.replace(/"/g, '""')}"`
    : safeValue
}

export function transactionsToCsv(rows: Record<string, unknown>[], columns: string[], columnHeaders: Record<string, string>): string {
  const headers = columns.map((col) => columnHeaders[col] || col)
  const lines = rows.map((row) => columns.map((col) => sanitizeCsvField(row[col])).join(","))
  return [headers.join(","), ...lines].join("\n")
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

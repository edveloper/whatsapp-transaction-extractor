"use client"

import { useState } from "react"
import { Download, FileJson, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type Transaction } from "./transaction-table"

interface SmartExportOptionsProps {
  transactions: Transaction[]
  visibleColumns: string[]
  columnHeaders: Record<string, string>
}

export default function SmartExportOptions({ transactions, visibleColumns, columnHeaders }: SmartExportOptionsProps) {
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "json">("csv")

  const generateFilename = () => {
    const date = new Date().toISOString().split("T")[0]
    return `transactions-${date}`
  }

  const downloadBlob = (blob: Blob, filename: string) => {
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

  const handleExportCSV = () => {
    const headers = visibleColumns.map((col) => columnHeaders[col] || col)
    const csvContent = [
      headers.join(","),
      ...transactions.map((tx) =>
        visibleColumns
          .map((col) => {
            const value = tx[col]
            const stringValue = String(value || "")
            return stringValue.includes(",") || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    downloadBlob(blob, `${generateFilename()}.csv`)
  }

  const handleExportJSON = () => {
    const data = transactions.map((tx) =>
      visibleColumns.reduce((acc, col) => {
        acc[columnHeaders[col] || col] = tx[col]
        return acc
      }, {} as Record<string, string | number | undefined>),
    )

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    downloadBlob(blob, `${generateFilename()}.json`)
  }

  return (
    <Card className="border-primary/20 bg-primary/5 p-4 md:p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground md:text-base">Export Options</h3>

      <div className="mb-4 grid grid-cols-2 gap-2 md:gap-3">
        {[
          { id: "csv", label: "CSV", icon: FileSpreadsheet },
          { id: "json", label: "JSON", icon: FileJson },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedFormat(id as "csv" | "json")}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all md:text-sm ${
              selectedFormat === id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {selectedFormat === "csv" && (
          <Button onClick={handleExportCSV} className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        )}
        {selectedFormat === "json" && (
          <Button onClick={handleExportJSON} className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Download JSON
          </Button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Exporting {transactions.length} transactions with {visibleColumns.length} columns
      </p>
    </Card>
  )
}

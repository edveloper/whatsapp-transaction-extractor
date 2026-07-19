"use client"

import { useState } from "react"
import { Download, FileJson, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Transaction } from "./transaction-table"
import { downloadBlob, transactionsToCsv } from "@/lib/csv"

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

  const handleExportCSV = () => {
    const csvContent = transactionsToCsv(transactions, visibleColumns, columnHeaders)
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
    <div className="card-bold bg-card p-4 text-card-foreground md:p-6">
      <h3 className="mb-4 font-display text-base font-bold text-foreground md:text-lg">Export Options</h3>

      <div className="mb-4 grid grid-cols-2 gap-2 md:gap-3">
        {[
          { id: "csv", label: "CSV", icon: FileSpreadsheet, color: "bg-pop-teal" },
          { id: "json", label: "JSON", icon: FileJson, color: "bg-pop-purple" },
        ].map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setSelectedFormat(id as "csv" | "json")}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 border-foreground p-3 text-xs font-bold transition-all md:text-sm ${
              selectedFormat === id ? color : "bg-card hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {selectedFormat === "csv" && (
          <Button onClick={handleExportCSV} className="badge-bold flex-1 gap-2 rounded-full bg-primary font-bold">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        )}
        {selectedFormat === "json" && (
          <Button onClick={handleExportJSON} className="badge-bold flex-1 gap-2 rounded-full bg-primary font-bold">
            <Download className="h-4 w-4" />
            Download JSON
          </Button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Exporting {transactions.length} transactions with {visibleColumns.length} columns
      </p>
    </div>
  )
}

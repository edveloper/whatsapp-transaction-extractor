"use client"

import { useState } from "react"
import { Download, FileJson, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SmartExportOptionsProps {
  transactions: Array<{ [key: string]: string | number }>
  visibleColumns: string[]
  columnHeaders: Record<string, string>
  fileName: string
}

export default function SmartExportOptions({
  transactions,
  visibleColumns,
  columnHeaders,
  fileName,
}: SmartExportOptionsProps) {
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "json" | "excel">("csv")

  const generateFilename = () => {
    const date = new Date().toISOString().split("T")[0]
    return `transactions-${date}`
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
      visibleColumns.reduce(
        (acc, col) => {
          acc[columnHeaders[col] || col] = tx[col]
          return acc
        },
        {} as Record<string, any>,
      ),
    )

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    downloadBlob(blob, `${generateFilename()}.json`)
  }

  const handleExportExcel = () => {
    // This is a pragmatic solution without needing xlsx library
    handleExportCSV()
    // Note: In future, we could use xlsx library for native Excel format
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
  }

  return (
    <Card className="p-4 md:p-6 bg-primary/5 border-primary/20">
      <h3 className="font-semibold text-foreground mb-4 text-sm md:text-base">Export Options</h3>

      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
        {[
          { id: "csv", label: "CSV", icon: FileSpreadsheet },
          { id: "json", label: "JSON", icon: FileJson },
          { id: "excel", label: "Excel", icon: FileSpreadsheet },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedFormat(id as any)}
            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 text-xs md:text-sm ${
              selectedFormat === id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {selectedFormat === "csv" && (
          <Button onClick={handleExportCSV} className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Download CSV
          </Button>
        )}
        {selectedFormat === "json" && (
          <Button onClick={handleExportJSON} className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
        )}
        {selectedFormat === "excel" && (
          <Button onClick={handleExportExcel} className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Download Excel
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Exporting {transactions.length} transactions with {visibleColumns.length} columns
      </p>
    </Card>
  )
}

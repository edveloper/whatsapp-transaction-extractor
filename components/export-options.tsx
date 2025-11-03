"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, FileJson } from "lucide-react"

interface ExportOptionsProps {
  transactions: Array<{ [key: string]: string | number }>
  visibleColumns: string[]
  columnHeaders: Record<string, string>
}

export default function ExportOptions({ transactions, visibleColumns, columnHeaders }: ExportOptionsProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")

  const handleExport = (format: "csv" | "json") => {
    if (transactions.length === 0) return

    if (format === "csv") {
      exportAsCSV()
    } else {
      exportAsJSON()
    }
  }

  const exportAsCSV = () => {
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
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportAsJSON = () => {
    const data = transactions.map((tx) =>
      visibleColumns.reduce(
        (acc, col) => {
          acc[columnHeaders[col] || col] = tx[col]
          return acc
        },
        {} as Record<string, string | number>,
      ),
    )

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8;",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions-${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="p-4 bg-secondary/30">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h4 className="font-semibold text-foreground">Export Format</h4>
          <p className="text-sm text-muted-foreground">Choose your preferred format</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => handleExport("csv")}
            variant={exportFormat === "csv" ? "default" : "outline"}
            className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button
            onClick={() => handleExport("json")}
            variant={exportFormat === "json" ? "default" : "outline"}
            className="flex-1 sm:flex-none gap-2"
          >
            <FileJson className="w-4 h-4" />
            JSON
          </Button>
        </div>
      </div>
    </Card>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Download, RotateCcw, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import TransactionTable from "./transaction-table"
import ColumnCustomizer from "./column-customizer"

interface Transaction {
  [key: string]: string | number
}

interface PreviewDashboardProps {
  transactions: Transaction[]
  fileName: string
  onReset: () => void
}

export default function PreviewDashboard({ transactions, fileName, onReset }: PreviewDashboardProps) {
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    transactions.length > 0 ? Object.keys(transactions[0]) : [],
  )
  const [columnHeaders, setColumnHeaders] = useState<Record<string, string>>(
    transactions.length > 0
      ? Object.keys(transactions[0]).reduce(
          (acc, key) => {
            acc[key] = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
            return acc
          },
          {} as Record<string, string>,
        )
      : {},
  )

  const filteredTransactions = useMemo(
    () =>
      transactions.map((tx) =>
        visibleColumns.reduce((acc, col) => {
          acc[col] = tx[col]
          return acc
        }, {} as Transaction),
      ),
    [transactions, visibleColumns],
  )

  const handleDownloadCSV = () => {
    if (filteredTransactions.length === 0) return

    // Create CSV header
    const headers = visibleColumns.map((col) => columnHeaders[col] || col)
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((tx) =>
        visibleColumns
          .map((col) => {
            const value = tx[col]
            // Handle commas and quotes in CSV
            const stringValue = String(value || "")
            return stringValue.includes(",") || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue
          })
          .join(","),
      ),
    ].join("\n")

    // Create and trigger download
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Extracted Transactions</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {filteredTransactions.length} transactions from {fileName}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
            variant="outline"
            className="gap-2 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Settings2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Customize</span>
          </Button>
          <Button
            onClick={handleDownloadCSV}
            className="gap-2 bg-primary hover:bg-primary/90 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Download CSV</span>
          </Button>
          <Button onClick={onReset} variant="ghost" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
            <RotateCcw className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">New File</span>
          </Button>
        </div>
      </div>

      {/* Column Customizer */}
      {showColumnCustomizer && (
        <ColumnCustomizer
          columns={visibleColumns}
          columnHeaders={columnHeaders}
          onColumnsChange={setVisibleColumns}
          onHeadersChange={setColumnHeaders}
        />
      )}

      {/* Transaction Table */}
      <TransactionTable transactions={filteredTransactions} columns={visibleColumns} columnHeaders={columnHeaders} />
    </div>
  )
}

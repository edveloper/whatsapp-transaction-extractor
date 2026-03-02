"use client"

import { useState, useMemo, useEffect } from "react"
import { AlertTriangle, Download, RotateCcw, Settings2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import TransactionTable, { type Transaction } from "./transaction-table" // Import the shared type
import ColumnCustomizer from "./column-customizer"
import AdvancedFilters from "./advanced-filters"
import TransactionAnalytics from "./transaction-analytics"
import SmartExportOptions from "./smart-export-options"
import { isLowConfidence } from "@/lib/whatsapp-parser"

interface PreviewDashboardProps {
  transactions: Transaction[]
  fileName: string
  onReset: () => void
}

export default function PreviewDashboard({ transactions, fileName, onReset }: PreviewDashboardProps) {
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)
  
  // Initialize columns based on the first transaction found
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    transactions.length > 0 ? Object.keys(transactions[0]) : [],
  )

  const [columnHeaders, setColumnHeaders] = useState<Record<string, string>>(
        transactions.length > 0
      ? Object.keys(transactions[0]).reduce(
          (acc, key) => {
            acc[key] =
              key === "CounterpartyId" ? "Counterparty ID" :
              key === "CounterpartyPhone" ? "Counterparty Phone" :
              key === "CounterpartyAccount" ? "Counterparty Account" :
              key === "CounterpartyPaybill" ? "Counterparty Paybill" :
              key === "CounterpartyTill" ? "Counterparty Till" :
              key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
            return acc
          },
          {} as Record<string, string>,
        )
      : {},
  )

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions)
  const lowConfidenceCount = useMemo(() => transactions.filter((tx) => isLowConfidence(tx)).length, [transactions])

  // Sync filtered transactions when the main transactions prop changes
  useEffect(() => {
    setFilteredTransactions(transactions)
  }, [transactions])

  const displayedTransactions = useMemo(
    () =>
      filteredTransactions.map((tx) =>
        visibleColumns.reduce((acc, col) => {
          acc[col] = tx[col]
          return acc
        }, {} as Transaction),
      ),
    [filteredTransactions, visibleColumns],
  )

  const handleDownloadCSV = () => {
    if (displayedTransactions.length === 0) return

    const headers = visibleColumns.map((col) => columnHeaders[col] || col)
    const csvContent = [
      headers.join(","),
      ...displayedTransactions.map((tx) =>
        visibleColumns
          .map((col) => {
            const value = tx[col]
            const stringValue = String(value || "")
            // Handle commas and quotes for CSV safety
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
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Extracted Transactions</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {displayedTransactions.length} of {transactions.length} transactions from {fileName}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
            variant="outline"
            className="gap-2 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Settings2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Customize Columns</span>
          </Button>
          <Button
            onClick={handleDownloadCSV}
            className="gap-2 bg-primary hover:bg-primary/90 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Download CSV</span>
          </Button>
          <Button 
            onClick={onReset} 
            variant="ghost" 
            className="gap-2 text-xs sm:text-sm w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Start Over</span>
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <TransactionAnalytics 
        transactions={filteredTransactions} 
        allColumns={Object.keys(transactions[0] || {})} 
      />

      {lowConfidenceCount > 0 && (
        <Alert className="border-amber-300/40 bg-amber-50/40">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-900">Review recommended</AlertTitle>
          <AlertDescription className="text-amber-800">
            {lowConfidenceCount} transaction{lowConfidenceCount === 1 ? "" : "s"} look manual or low-confidence. Use the
            filter below to review them before export.
          </AlertDescription>
        </Alert>
      )}

      {/* Advanced Filters */}
      <AdvancedFilters
        transactions={transactions}
        onFiltersChange={setFilteredTransactions}
        allColumns={visibleColumns}
      />

      {/* Column Customizer Panel */}
      {showColumnCustomizer && (
        <ColumnCustomizer
          columns={Object.keys(transactions[0] || {})} // Show all available keys
          selectedColumns={visibleColumns}
          columnHeaders={columnHeaders}
          onColumnsChange={setVisibleColumns}
          onHeadersChange={(headers) =>
            setColumnHeaders({
              ...headers,
              CounterpartyId: headers.CounterpartyId || "Counterparty ID",
              CounterpartyPhone: headers.CounterpartyPhone || "Counterparty Phone",
              CounterpartyAccount: headers.CounterpartyAccount || "Counterparty Account",
              CounterpartyPaybill: headers.CounterpartyPaybill || "Counterparty Paybill",
              CounterpartyTill: headers.CounterpartyTill || "Counterparty Till",
            })
          }
        />
      )}

      {/* Smart Export Options */}
      <SmartExportOptions
        transactions={displayedTransactions}
        visibleColumns={visibleColumns}
        columnHeaders={columnHeaders}
      />

      {/* Transaction Table */}
      <TransactionTable 
        transactions={displayedTransactions} 
        columns={visibleColumns} 
        columnHeaders={columnHeaders} 
      />
    </div>
  )
}

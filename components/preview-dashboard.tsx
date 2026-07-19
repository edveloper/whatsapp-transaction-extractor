"use client"

import { useState, useMemo } from "react"
import { Download, RotateCcw, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import TransactionTable, { type Transaction } from "./transaction-table" // Import the shared type
import ColumnCustomizer from "./column-customizer"
import AdvancedFilters from "./advanced-filters"
import TransactionAnalytics from "./transaction-analytics"
import SmartExportOptions from "./smart-export-options"
import ReviewQueue from "./review-queue"
import { isLowConfidence } from "@/lib/whatsapp-parser"
import { downloadBlob, transactionsToCsv } from "@/lib/csv"

interface PreviewDashboardProps {
  transactions: Transaction[]
  fileName: string
  onReset: () => void
}

// The raw WhatsApp message text is kept for the review queue but was never meant to be a
// spreadsheet column.
const HIDDEN_COLUMNS = new Set(["rawContent"])

export default function PreviewDashboard({ transactions, fileName, onReset }: PreviewDashboardProps) {
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)

  // A mutable working copy, edited in place by the review queue. Rows are never removed from
  // this array (discards are tracked separately) so indices stay stable for save/confirm/discard.
  const [workingTransactions, setWorkingTransactions] = useState<Transaction[]>(transactions)
  const [discardedIndices, setDiscardedIndices] = useState<Set<number>>(new Set())

  // Reset the working copy when a new file is uploaded (a new `transactions` reference). Adjusted
  // during render rather than in an effect -- React's recommended pattern for "derive state from
  // a prop change" -- so it doesn't cost an extra render pass.
  const [prevTransactions, setPrevTransactions] = useState(transactions)
  if (transactions !== prevTransactions) {
    setPrevTransactions(transactions)
    setWorkingTransactions(transactions)
    setDiscardedIndices(new Set())
  }

  const activeTransactions = useMemo(
    () => workingTransactions.filter((_, index) => !discardedIndices.has(index)),
    [workingTransactions, discardedIndices],
  )

  const availableColumns = useMemo(
    () => (transactions.length > 0 ? Object.keys(transactions[0]).filter((key) => !HIDDEN_COLUMNS.has(key)) : []),
    [transactions],
  )

  // Initialize columns based on the first transaction found
  const [visibleColumns, setVisibleColumns] = useState<string[]>(availableColumns)

  const [columnHeaders, setColumnHeaders] = useState<Record<string, string>>(
    availableColumns.reduce(
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
    ),
  )

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(activeTransactions)
  const lowConfidenceCount = useMemo(() => activeTransactions.filter((tx) => isLowConfidence(tx)).length, [activeTransactions])

  // Same "adjust during render" pattern: reset the filtered view whenever the active set changes
  // underneath it (new file, edit, or discard). AdvancedFilters otherwise owns this state via
  // onFiltersChange, so this only fires on the reference change, not every render.
  const [prevActiveTransactions, setPrevActiveTransactions] = useState(activeTransactions)
  if (activeTransactions !== prevActiveTransactions) {
    setPrevActiveTransactions(activeTransactions)
    setFilteredTransactions(activeTransactions)
  }

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

    const csvContent = transactionsToCsv(displayedTransactions, visibleColumns, columnHeaders)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    downloadBlob(blob, `transactions-${new Date().toISOString().split("T")[0]}.csv`)
  }

  const handleSaveReview = (index: number, updated: Transaction) => {
    setWorkingTransactions((current) => current.map((tx, i) => (i === index ? updated : tx)))
  }

  const handleConfirmReview = (index: number) => {
    setWorkingTransactions((current) => current.map((tx, i) => (i === index ? { ...tx, confidence: 1 } : tx)))
  }

  const handleDiscardReview = (index: number) => {
    setDiscardedIndices((current) => new Set(current).add(index))
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Extracted Transactions</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {displayedTransactions.length} of {transactions.length} transactions from {fileName}
              {lowConfidenceCount > 0 && (
                <span className="font-semibold text-accent"> · {lowConfidenceCount} awaiting review</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
            variant="outline"
            className="badge-bold gap-2 rounded-full bg-card text-xs font-bold sm:text-sm w-full sm:w-auto"
          >
            <Settings2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Customize Columns</span>
          </Button>
          <Button
            onClick={handleDownloadCSV}
            className="badge-bold gap-2 rounded-full bg-pop-teal text-xs font-bold text-foreground hover:bg-pop-teal/90 sm:text-sm w-full sm:w-auto"
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
        allColumns={availableColumns}
      />

      {/* Review Queue */}
      <ReviewQueue
        transactions={workingTransactions}
        discardedIndices={discardedIndices}
        onSave={handleSaveReview}
        onConfirm={handleConfirmReview}
        onDiscard={handleDiscardReview}
      />

      {/* Advanced Filters */}
      <AdvancedFilters
        transactions={activeTransactions}
        onFiltersChange={setFilteredTransactions}
        allColumns={visibleColumns}
      />

      {/* Column Customizer Panel */}
      {showColumnCustomizer && (
        <ColumnCustomizer
          columns={availableColumns} // Show all available keys
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

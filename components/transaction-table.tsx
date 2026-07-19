"use client"

import { useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AlertTriangle, ChevronDown, ChevronUp, Tag, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { isLowConfidence } from "@/lib/whatsapp-parser"

// This interface now matches your API and Home page perfectly
export interface Transaction {
  [key: string]: string | number | undefined
  Date: string
  Amount: number
  Type: string
  Reference: string
  "Paid By": string
  "Paid To": string
  CounterpartyId: string
  CounterpartyPhone?: string
  CounterpartyAccount?: string
  CounterpartyPaybill?: string
  CounterpartyTill?: string
  Purpose: string
  Category?: string
  MerchantType?: string
  confidence?: number
  sourcePattern?: string
  rawContent?: string
}

interface TransactionTableProps {
  transactions: Transaction[]
  columns: string[]
  columnHeaders: Record<string, string>
}

// Below this, the plain 70vh-capped table already renders every row fine -- virtualizing a
// 40-row table just adds overhead (measuring, spacer rows) with no visible benefit. Above it,
// a WhatsApp export with hundreds of manual entries would otherwise mean hundreds of live DOM
// rows on the page at once.
const VIRTUALIZE_THRESHOLD = 60
const ESTIMATED_ROW_HEIGHT = 45

export default function TransactionTable({ transactions, columns, columnHeaders }: TransactionTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions]
    if (sortConfig) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? ""
        const bValue = b[sortConfig.key] ?? ""

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return sorted
  }, [transactions, sortConfig])

  const shouldVirtualize = sortedTransactions.length > VIRTUALIZE_THRESHOLD

  const virtualizer = useVirtualizer({
    count: sortedTransactions.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 12,
  })

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null
      }
      return { key, direction: "asc" }
    })
  }

  // Helper to render special AI cells with badges
  const renderCellContent = (col: string, value: any) => {
    if (!value) return <span className="text-muted-foreground/50">---</span>

    if (col === "Category") {
      return (
        <Badge variant="secondary" className="gap-1 rounded-full border border-foreground bg-pop-teal/30 capitalize text-foreground">
          <Tag className="w-3 h-3" />
          {value}
        </Badge>
      )
    }

    if (col === "MerchantType") {
      return (
        <Badge variant="outline" className="gap-1 rounded-full border border-foreground capitalize text-muted-foreground">
          <Store className="w-3 h-3" />
          {value}
        </Badge>
      )
    }

    if (col === "Amount") {
      return <span className="font-mono font-medium">{Number(value).toLocaleString()}</span>
    }

    if (col === "confidence") {
      const confidenceValue = Number(value)
      return (
        <Badge
          variant={confidenceValue < 0.75 ? "destructive" : "outline"}
          className={`gap-1 rounded-full border border-foreground ${confidenceValue < 0.75 ? "bg-pop-orange text-foreground" : ""}`}
        >
          {confidenceValue < 0.75 && <AlertTriangle className="w-3 h-3" />}
          {Math.round(confidenceValue * 100)}%
        </Badge>
      )
    }

    return String(value)
  }

  const renderRow = (transaction: Transaction, idx: number) => (
    <tr
      key={idx}
      className={`border-b border-border hover:bg-muted/30 transition-colors ${
        isLowConfidence(transaction) ? "bg-pop-orange/10" : ""
      }`}
      style={{ height: ESTIMATED_ROW_HEIGHT }}
    >
      {columns.map((col) => (
        <td key={`${idx}-${col}`} className="px-4 py-3">
          <div className="max-w-[200px] lg:max-w-[300px] truncate" title={String(transaction[col])}>
            {renderCellContent(col, transaction[col])}
          </div>
        </td>
      ))}
    </tr>
  )

  if (transactions.length === 0) {
    return (
      <div className="card-bold bg-card p-6 text-center text-card-foreground md:p-8">
        <p className="text-sm md:text-base text-muted-foreground">No transactions found.</p>
      </div>
    )
  }

  const virtualRows = shouldVirtualize ? virtualizer.getVirtualItems() : []
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom = virtualRows.length > 0 ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0

  return (
    <div className="card-bold overflow-hidden bg-card text-card-foreground">
      <div ref={scrollRef} className="overflow-x-auto overflow-y-auto" style={{ maxHeight: shouldVirtualize ? "70vh" : undefined }}>
        <table className="w-full text-xs md:text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-foreground bg-pop-yellow/40">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left font-bold text-foreground cursor-pointer hover:bg-pop-yellow/60 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span>{columnHeaders[col] || col}</span>
                    {sortConfig?.key === col && (
                      <span className="text-primary">
                        {sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shouldVirtualize ? (
              <>
                {paddingTop > 0 && (
                  <tr aria-hidden="true">
                    <td colSpan={columns.length} style={{ height: paddingTop, padding: 0, border: 0 }} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => renderRow(sortedTransactions[virtualRow.index], virtualRow.index))}
                {paddingBottom > 0 && (
                  <tr aria-hidden="true">
                    <td colSpan={columns.length} style={{ height: paddingBottom, padding: 0, border: 0 }} />
                  </tr>
                )}
              </>
            ) : (
              sortedTransactions.map((transaction, idx) => renderRow(transaction, idx))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

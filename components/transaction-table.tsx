"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, Tag, Store } from "lucide-react"
import { Card } from "@/components/ui/card"
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
}

interface TransactionTableProps {
  transactions: Transaction[]
  columns: string[]
  columnHeaders: Record<string, string>
}

export default function TransactionTable({ transactions, columns, columnHeaders }: TransactionTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

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
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 capitalize">
          <Tag className="w-3 h-3" />
          {value}
        </Badge>
      )
    }

    if (col === "MerchantType") {
      return (
        <Badge variant="outline" className="gap-1 capitalize text-muted-foreground">
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
        <Badge variant={confidenceValue < 0.75 ? "destructive" : "outline"} className="gap-1">
          {confidenceValue < 0.75 && <AlertTriangle className="w-3 h-3" />}
          {Math.round(confidenceValue * 100)}%
        </Badge>
      )
    }

    return String(value)
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-6 md:p-8 text-center">
        <p className="text-sm md:text-base text-muted-foreground">No transactions found.</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/50">
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-muted transition-colors whitespace-nowrap"
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
            {sortedTransactions.map((transaction, idx) => (
              <tr
                key={idx}
                className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${
                  isLowConfidence(transaction) ? "bg-amber-500/5" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={`${idx}-${col}`} className="px-4 py-3">
                    <div className="max-w-[200px] lg:max-w-[300px] truncate" title={String(transaction[col])}>
                      {renderCellContent(col, transaction[col])}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

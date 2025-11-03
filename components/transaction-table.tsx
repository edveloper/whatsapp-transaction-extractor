"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/card"

interface TransactionTableProps {
  transactions: Array<{ [key: string]: string | number }>
  columns: string[]
  columnHeaders: Record<string, string>
}

export default function TransactionTable({ transactions, columns, columnHeaders }: TransactionTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions]
    if (sortConfig) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

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

  if (transactions.length === 0) {
    return (
      <Card className="p-6 md:p-8 text-center">
        <p className="text-sm md:text-base text-muted-foreground">No transactions found in the file.</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-secondary transition-colors whitespace-nowrap"
                  title={columnHeaders[col] || col}
                >
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="line-clamp-1">{columnHeaders[col] || col}</span>
                    {sortConfig?.key === col && (
                      <span className="flex-shrink-0">
                        {sortConfig.direction === "asc" ? (
                          <ChevronUp className="w-3 h-3 md:w-4 md:h-4" />
                        ) : (
                          <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction, idx) => (
              <tr key={idx} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                {columns.map((col) => (
                  <td key={`${idx}-${col}`} className="px-2 md:px-4 py-2 md:py-3 text-foreground">
                    <span className="block truncate max-w-xs md:max-w-sm lg:max-w-md" title={String(transaction[col])}>
                      {transaction[col]}
                    </span>
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

"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface TransactionAnalyticsProps {
  transactions: Array<{ [key: string]: string | number }>
  allColumns: string[]
}

export default function TransactionAnalytics({ transactions, allColumns }: TransactionAnalyticsProps) {
  // Detect amount and type columns
  const amountColumn = allColumns.find(
    (col) =>
      col.toLowerCase().includes("amount") ||
      col.toLowerCase().includes("value") ||
      col.toLowerCase().includes("price"),
  )
  const typeColumn = allColumns.find(
    (col) => col.toLowerCase().includes("type") || col.toLowerCase().includes("category"),
  )

  const analytics = useMemo(() => {
    if (transactions.length === 0) {
      return {
        totalAmount: 0,
        avgAmount: 0,
        txCount: 0,
        byType: [] as Array<{ name: string; value: number; count: number }>,
      }
    }

    let totalAmount = 0
    const typeMap = new Map<string, { total: number; count: number }>()

    transactions.forEach((tx) => {
      // Sum amounts
      if (amountColumn) {
        try {
          const amountStr = String(tx[amountColumn] || "0").replace(/[^\d.-]/g, "")
          const amount = Number.parseFloat(amountStr) || 0
          totalAmount += amount
        } catch {
          // Skip invalid amounts
        }
      }

      // Count by type
      if (typeColumn) {
        const type = String(tx[typeColumn] || "Unknown")
        const current = typeMap.get(type) || { total: 0, count: 0 }
        current.count += 1

        if (amountColumn) {
          try {
            const amountStr = String(tx[amountColumn] || "0").replace(/[^\d.-]/g, "")
            const amount = Number.parseFloat(amountStr) || 0
            current.total += amount
          } catch {
            // Skip
          }
        }

        typeMap.set(type, current)
      }
    })

    const byType = Array.from(typeMap.entries())
      .map(([name, { total, count }]) => ({
        name: name.length > 15 ? name.substring(0, 12) + "..." : name,
        value: total,
        count,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      totalAmount,
      avgAmount: transactions.length > 0 ? totalAmount / transactions.length : 0,
      txCount: transactions.length,
      byType,
    }
  }, [transactions, amountColumn, typeColumn])

  const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Summary Cards */}
      <Card className="p-4 md:p-6">
        <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Transactions</p>
        <p className="text-2xl md:text-3xl font-bold text-foreground">{analytics.txCount}</p>
      </Card>

      {amountColumn && (
        <>
          <Card className="p-4 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              {analytics.totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </Card>

          <Card className="p-4 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground mb-1">Average Amount</p>
            <p className="text-2xl md:text-3xl font-bold text-accent">
              {analytics.avgAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </Card>
        </>
      )}

      {/* Type Distribution Chart */}
      {typeColumn && analytics.byType.length > 0 && (
        <Card className="col-span-full p-4 md:p-6">
          <p className="text-sm font-semibold text-foreground mb-4">Transaction Type Distribution</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.byType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name} (${count})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.byType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value} transactions`}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}

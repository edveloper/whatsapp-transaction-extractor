"use client"

import { useMemo } from "react"
import { AlertTriangle, BarChart3, Landmark, Receipt, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Transaction } from "./transaction-table"
import { isLowConfidence } from "@/lib/whatsapp-parser"

interface TransactionAnalyticsProps {
  transactions: Transaction[]
  allColumns: string[]
}

const BAR_COLOR = "#1d4ed8"

export default function TransactionAnalytics({ transactions }: TransactionAnalyticsProps) {
  const stats = useMemo(() => {
    const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.Amount || 0), 0)
    const lowConfidenceCount = transactions.filter((tx) => isLowConfidence(tx)).length
    const structuredCount = transactions.length - lowConfidenceCount
    const averageAmount = transactions.length > 0 ? totalAmount / transactions.length : 0

    const typeTotals = new Map<string, number>()
    const counterpartyTotals = new Map<string, number>()

    for (const tx of transactions) {
      const type = tx.Type || "Unknown"
      typeTotals.set(type, (typeTotals.get(type) || 0) + Number(tx.Amount || 0))

      const counterparty = tx["Paid To"] || tx.CounterpartyId || "Unassigned"
      counterpartyTotals.set(counterparty, (counterpartyTotals.get(counterparty) || 0) + Number(tx.Amount || 0))
    }

    const typeChartData = Array.from(typeTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    const topCounterparties = Array.from(counterpartyTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return {
      totalAmount,
      lowConfidenceCount,
      structuredCount,
      averageAmount,
      typeChartData,
      topCounterparties,
    }
  }, [transactions])

  if (transactions.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Volume"
          value={`Ksh ${stats.totalAmount.toLocaleString()}`}
          note={`Across ${transactions.length} extracted transactions`}
          icon={<Landmark className="h-5 w-5" />}
        />
        <MetricCard
          title="Average Transaction"
          value={`Ksh ${Math.round(stats.averageAmount).toLocaleString()}`}
          note="Mean value across all extracted rows"
          icon={<Receipt className="h-5 w-5" />}
        />
        <MetricCard
          title="Structured Matches"
          value={stats.structuredCount}
          note="Rows matched from clear payment or bank patterns"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Review Queue"
          value={stats.lowConfidenceCount}
          note="Manual or low-confidence rows to check before export"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Volume by Transaction Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-4">
            {stats.typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.typeChartData} margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip
                    cursor={{ fill: "rgba(29, 78, 216, 0.08)" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`Ksh ${value.toLocaleString()}`, "Volume"]}
                  />
                  <Bar dataKey="value" fill={BAR_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No transaction-type data available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Top Counterparties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {stats.topCounterparties.length > 0 ? (
              stats.topCounterparties.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-secondary/20 px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    </div>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold text-foreground">Ksh {item.value.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No counterparty data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  note: string
  icon: React.ReactNode
  tone?: "default" | "warning"
}

function MetricCard({ title, value, note, icon, tone = "default" }: MetricCardProps) {
  const toneClasses =
    tone === "warning"
      ? "border-amber-300/40 bg-amber-50/40 text-amber-900"
      : "border-border/50 bg-card text-foreground"

  return (
    <Card className={`${toneClasses} shadow-sm`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          <div className="text-3xl font-bold">{value}</div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

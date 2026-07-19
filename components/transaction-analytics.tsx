"use client"

import { useMemo } from "react"
import { AlertTriangle, BarChart3, Landmark, Receipt, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Transaction } from "./transaction-table"
import { isLowConfidence } from "@/lib/whatsapp-parser"

interface TransactionAnalyticsProps {
  transactions: Transaction[]
  allColumns: string[]
}

const BAR_COLOR = "#1f7a4d"
const CATEGORY_COLORS = ["#1f7a4d", "#eb6fa4", "#2bb3a3", "#e8823c", "#a787d3", "#e8b23d"]
const COUNTERPARTY_COLORS = ["bg-pop-teal", "bg-pop-pink", "bg-pop-yellow", "bg-pop-orange", "bg-pop-purple"]

export default function TransactionAnalytics({ transactions }: TransactionAnalyticsProps) {
  const stats = useMemo(() => {
    const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.Amount || 0), 0)
    const lowConfidenceCount = transactions.filter((tx) => isLowConfidence(tx)).length
    const structuredCount = transactions.length - lowConfidenceCount
    const averageAmount = transactions.length > 0 ? totalAmount / transactions.length : 0

    const typeTotals = new Map<string, number>()
    const counterpartyTotals = new Map<string, number>()
    const categoryTotals = new Map<string, number>()

    for (const tx of transactions) {
      const type = tx.Type || "Unknown"
      typeTotals.set(type, (typeTotals.get(type) || 0) + Number(tx.Amount || 0))

      const counterparty = tx["Paid To"] || tx.CounterpartyId || "Unassigned"
      counterpartyTotals.set(counterparty, (counterpartyTotals.get(counterparty) || 0) + Number(tx.Amount || 0))

      const category = tx.Category || "Uncategorized"
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + Number(tx.Amount || 0))
    }

    const typeChartData = Array.from(typeTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    const topCounterparties = Array.from(counterpartyTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const categoryChartData = Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return {
      totalAmount,
      lowConfidenceCount,
      structuredCount,
      averageAmount,
      typeChartData,
      topCounterparties,
      categoryChartData,
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
          icon={<Landmark className="h-5 w-5" strokeWidth={2.25} />}
          color="bg-pop-teal"
        />
        <MetricCard
          title="Average Transaction"
          value={`Ksh ${Math.round(stats.averageAmount).toLocaleString()}`}
          note="Mean value across all extracted rows"
          icon={<Receipt className="h-5 w-5" strokeWidth={2.25} />}
          color="bg-pop-purple"
        />
        <MetricCard
          title="Structured Matches"
          value={stats.structuredCount}
          note="Rows matched from clear payment or bank patterns"
          icon={<BarChart3 className="h-5 w-5" strokeWidth={2.25} />}
          color="bg-primary"
          iconColor="text-primary-foreground"
        />
        <MetricCard
          title="Review Queue"
          value={stats.lowConfidenceCount}
          note="Manual or low-confidence rows to check before export"
          icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.25} />}
          color="bg-pop-orange"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card-bold bg-card text-card-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold text-foreground">Volume by Transaction Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-4">
            {stats.typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.typeChartData} margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip
                    cursor={{ fill: "rgba(31, 122, 77, 0.08)" }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "2px solid var(--foreground)",
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
        </div>

        <div className="card-bold bg-card text-card-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold text-foreground">Top Counterparties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {stats.topCounterparties.length > 0 ? (
              stats.topCounterparties.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-lg border-2 border-foreground bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-foreground ${COUNTERPARTY_COLORS[index % COUNTERPARTY_COLORS.length]}`}
                      >
                        <Users className="h-3 w-3 text-foreground" strokeWidth={2.5} />
                      </span>
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
        </div>
      </div>

      <div className="card-bold bg-card text-card-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base font-bold text-foreground">Spend by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-4 sm:flex-row">
          <div className="h-[160px] w-[160px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.categoryChartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={2}>
                  {stats.categoryChartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`Ksh ${value.toLocaleString()}`, "Volume"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full min-w-0 space-y-2">
            {stats.categoryChartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-sm border border-foreground"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="truncate text-foreground">{item.name}</span>
                <span className="ml-auto flex-shrink-0 font-mono text-muted-foreground">Ksh {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  note: string
  icon: React.ReactNode
  color: string
  // The primary green fails WCAG contrast against dark ink icons (2.8:1) -- only bg-primary
  // needs the light paper color instead; every other pop color already passes with dark ink.
  iconColor?: string
}

function MetricCard({ title, value, note, icon, color, iconColor = "text-foreground" }: MetricCardProps) {
  return (
    <div className="card-bold bg-card p-4 text-card-foreground">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground ${color}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

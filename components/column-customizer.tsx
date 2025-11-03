"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useState } from "react"

interface ColumnCustomizerProps {
  columns: string[]
  columnHeaders: Record<string, string>
  onColumnsChange: (columns: string[]) => void
  onHeadersChange: (headers: Record<string, string>) => void
}

export default function ColumnCustomizer({
  columns: allColumns,
  columnHeaders,
  onColumnsChange,
  onHeadersChange,
}: ColumnCustomizerProps) {
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null)

  const handleColumnToggle = (column: string) => {
    // Get all columns from columnHeaders
    const allCols = Object.keys(columnHeaders)
    const isVisible = allColumns.includes(column)

    if (isVisible) {
      onColumnsChange(allColumns.filter((c) => c !== column))
    } else {
      // Add column back in its original position
      const newColumns = allCols.filter((c) => allColumns.includes(c) || c === column)
      onColumnsChange(newColumns)
    }
  }

  const handleHeaderChange = (column: string, newHeader: string) => {
    onHeadersChange({
      ...columnHeaders,
      [column]: newHeader,
    })
  }

  return (
    <Card className="p-4 md:p-6 bg-secondary/30">
      <h3 className="font-semibold text-foreground mb-4 text-sm md:text-base">Customize Columns</h3>

      <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
        {Object.entries(columnHeaders).map(([column, header]) => {
          const isVisible = allColumns.includes(column)
          const isExpanded = expandedColumn === column

          return (
            <div key={column}>
              {/* Mobile: Accordion view */}
              <div className="md:hidden">
                <button
                  onClick={() => setExpandedColumn(isExpanded ? null : column)}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-card/80 transition-colors"
                >
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={() => handleColumnToggle(column)}
                    className="flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">{column}</p>
                    <p className="text-sm font-medium text-foreground truncate">{header || column}</p>
                  </div>
                  <span className="text-muted-foreground">{isExpanded ? "−" : "+"}</span>
                </button>

                {isExpanded && (
                  <div className="px-3 py-3 bg-secondary/20 border-t border-border/50">
                    <label className="text-xs font-medium text-muted-foreground block mb-2">Display Name</label>
                    <Input
                      value={header}
                      onChange={(e) => handleHeaderChange(column, e.target.value)}
                      className="w-full text-sm"
                      placeholder="Column header"
                      disabled={!isVisible}
                    />
                  </div>
                )}
              </div>

              {/* Desktop: Full view */}
              <div className="hidden md:flex items-center gap-4 p-3 bg-card rounded-lg">
                <Checkbox
                  checked={isVisible}
                  onCheckedChange={() => handleColumnToggle(column)}
                  className="flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Display Name</label>
                  <Input
                    value={header}
                    onChange={(e) => handleHeaderChange(column, e.target.value)}
                    className="w-full text-sm"
                    placeholder="Column header"
                    disabled={!isVisible}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

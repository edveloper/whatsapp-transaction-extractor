"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Filter } from "lucide-react"

interface AdvancedFiltersProps {
  transactions: Array<{ [key: string]: string | number }>
  onFiltersChange: (filtered: Array<{ [key: string]: string | number }>) => void
  allColumns: string[]
}

interface FilterState {
  searchTerm: string
  dateFrom: string
  dateTo: string
  amountMin: number | null
  amountMax: number | null
  transactionType: string
}

export default function AdvancedFilters({ transactions, onFiltersChange, allColumns }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    amountMin: null,
    amountMax: null,
    transactionType: "",
  })
  const [isExpanded, setIsExpanded] = useState(false)

  // Detect potential column types
  const dateColumns = allColumns.filter(
    (col) => col.toLowerCase().includes("date") || col.toLowerCase().includes("time"),
  )
  const amountColumns = allColumns.filter(
    (col) =>
      col.toLowerCase().includes("amount") ||
      col.toLowerCase().includes("value") ||
      col.toLowerCase().includes("price"),
  )
  const typeColumns = allColumns.filter(
    (col) =>
      col.toLowerCase().includes("type") ||
      col.toLowerCase().includes("category") ||
      col.toLowerCase().includes("description"),
  )

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...transactions]

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter((tx) => Object.values(tx).some((val) => String(val).toLowerCase().includes(term)))
    }

    // Date range filter
    if (filters.dateFrom && dateColumns.length > 0) {
      const fromDate = new Date(filters.dateFrom).getTime()
      filtered = filtered.filter((tx) => {
        const dateVal = tx[dateColumns[0]]
        if (!dateVal) return true
        try {
          return new Date(String(dateVal)).getTime() >= fromDate
        } catch {
          return true
        }
      })
    }

    if (filters.dateTo && dateColumns.length > 0) {
      const toDate = new Date(filters.dateTo).getTime()
      filtered = filtered.filter((tx) => {
        const dateVal = tx[dateColumns[0]]
        if (!dateVal) return true
        try {
          return new Date(String(dateVal)).getTime() <= toDate
        } catch {
          return true
        }
      })
    }

    // Amount range filter
    if (filters.amountMin !== null && amountColumns.length > 0) {
      filtered = filtered.filter((tx) => {
        const amountVal = tx[amountColumns[0]]
        if (!amountVal) return true
        try {
          const amount = Number.parseFloat(String(amountVal).replace(/[^\d.-]/g, ""))
          return !isNaN(amount) && amount >= filters.amountMin!
        } catch {
          return true
        }
      })
    }

    if (filters.amountMax !== null && amountColumns.length > 0) {
      filtered = filtered.filter((tx) => {
        const amountVal = tx[amountColumns[0]]
        if (!amountVal) return true
        try {
          const amount = Number.parseFloat(String(amountVal).replace(/[^\d.-]/g, ""))
          return !isNaN(amount) && amount <= filters.amountMax!
        } catch {
          return true
        }
      })
    }

    // Transaction type filter
    if (filters.transactionType && typeColumns.length > 0) {
      filtered = filtered.filter((tx) => {
        const typeVal = String(tx[typeColumns[0]]).toLowerCase()
        return typeVal.includes(filters.transactionType.toLowerCase())
      })
    }

    onFiltersChange(filtered)
  }, [filters, transactions, onFiltersChange, dateColumns, amountColumns, typeColumns])

  const handleFilterChange = (key: keyof FilterState, value: string | number | null) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
      amountMin: null,
      amountMax: null,
      transactionType: "",
    })
    onFiltersChange(transactions)
  }

  const hasActiveFilters =
    filters.searchTerm ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.amountMin !== null ||
    filters.amountMax !== null ||
    filters.transactionType

  return (
    <Card className="p-4 md:p-6 bg-secondary/30">
      <button
        onClick={() => {
          setIsExpanded(!isExpanded)
          if (!isExpanded) setTimeout(applyFilters, 0)
        }}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm md:text-base">Advanced Filters</h3>
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">Active</span>
          )}
        </div>
        <span className="text-muted-foreground">{isExpanded ? "−" : "+"}</span>
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Search</label>
            <Input
              placeholder="Search all fields..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="w-full text-sm"
            />
          </div>

          {/* Date Range */}
          {dateColumns.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="w-full text-sm"
                />
              </div>
            </div>
          )}

          {/* Amount Range */}
          {amountColumns.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Min Amount</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.amountMin ?? ""}
                  onChange={(e) =>
                    handleFilterChange("amountMin", e.target.value ? Number.parseFloat(e.target.value) : null)
                  }
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Max Amount</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.amountMax ?? ""}
                  onChange={(e) =>
                    handleFilterChange("amountMax", e.target.value ? Number.parseFloat(e.target.value) : null)
                  }
                  className="w-full text-sm"
                />
              </div>
            </div>
          )}

          {/* Transaction Type */}
          {typeColumns.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Transaction Type</label>
              <Input
                placeholder="E.g., M-Pesa, Bank Transfer..."
                value={filters.transactionType}
                onChange={(e) => handleFilterChange("transactionType", e.target.value)}
                className="w-full text-sm"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button onClick={applyFilters} className="flex-1 text-sm">
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="flex-1 text-sm gap-2 bg-transparent">
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

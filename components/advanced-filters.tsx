"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, FilterX, Tag, Building2 } from "lucide-react"
import { type Transaction } from "./transaction-table"
import { isLowConfidence } from "@/lib/whatsapp-parser"

interface AdvancedFiltersProps {
  transactions: Transaction[]
  onFiltersChange: (filtered: Transaction[]) => void
  allColumns: string[]
}

export default function AdvancedFilters({ transactions, onFiltersChange }: AdvancedFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null)
  const [reviewOnly, setReviewOnly] = useState(false)

  // Extract unique categories and merchant types dynamically
  const categories = Array.from(new Set(transactions.map((tx) => tx.Category).filter(Boolean))) as string[]
  const merchantTypes = Array.from(new Set(transactions.map((tx) => tx.MerchantType).filter(Boolean))) as string[]

  useEffect(() => {
    const filtered = transactions.filter((tx) => {
      const searchStr = `${tx["Paid To"]} ${tx.CounterpartyId} ${tx.Purpose} ${tx.Reference}`.toLowerCase()
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory ? tx.Category === selectedCategory : true
      const matchesMerchant = selectedMerchant ? tx.MerchantType === selectedMerchant : true
      const matchesReview = reviewOnly ? isLowConfidence(tx) : true
      
      return matchesSearch && matchesCategory && matchesMerchant && matchesReview
    })
    onFiltersChange(filtered)
  }, [searchTerm, selectedCategory, selectedMerchant, reviewOnly, transactions, onFiltersChange])

  const hasActiveFilters = searchTerm || selectedCategory || selectedMerchant || reviewOnly

  return (
    <div className="card-bold space-y-4 bg-card p-6 text-card-foreground">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search merchants, references, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-full border-2 border-foreground bg-background pl-10"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => { setSearchTerm(""); setSelectedCategory(null); setSelectedMerchant(null); setReviewOnly(false); }}
            className="text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <FilterX className="w-4 h-4 mr-2" /> Reset Filters
          </Button>
        )}
      </div>

      <div className="space-y-3 pt-2">
        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-2">
              <Tag className="w-3 h-3" /> Categories
            </span>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className={`cursor-pointer rounded-full border-2 border-foreground capitalize transition-all hover:scale-105 ${selectedCategory === cat ? "bg-pop-teal text-foreground" : "bg-card"}`}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Merchant Type Pills */}
        {merchantTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-2">
              <Building2 className="w-3 h-3" /> Merchant Type
            </span>
            {merchantTypes.map((type) => (
              <Badge
                key={type}
                variant="outline"
                className={`cursor-pointer rounded-full border-2 border-foreground capitalize transition-all hover:scale-105 ${selectedMerchant === type ? "bg-pop-orange text-foreground" : "bg-card"}`}
                onClick={() => setSelectedMerchant(selectedMerchant === type ? null : type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-2">
            Review
          </span>
          <Badge
            variant="outline"
            className={`cursor-pointer rounded-full border-2 border-foreground transition-all hover:scale-105 ${reviewOnly ? "bg-pop-yellow text-foreground" : "bg-card"}`}
            onClick={() => setReviewOnly((current) => !current)}
          >
            Low Confidence Only
          </Badge>
        </div>
      </div>
    </div>
  )
}

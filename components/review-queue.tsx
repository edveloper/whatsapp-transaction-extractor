"use client"

import { useState } from "react"
import { AlertTriangle, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isLowConfidence } from "@/lib/whatsapp-parser"
import { type Transaction } from "./transaction-table"

interface ReviewQueueProps {
  transactions: Transaction[]
  discardedIndices: Set<number>
  onSave: (index: number, updated: Transaction) => void
  onConfirm: (index: number) => void
  onDiscard: (index: number) => void
}

const EDITABLE_FIELDS = ["Amount", "Type", "Paid To", "Purpose"] as const

export default function ReviewQueue({ transactions, discardedIndices, onSave, onConfirm, onDiscard }: ReviewQueueProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, Partial<Transaction>>>({})

  const pending = transactions
    .map((tx, index) => ({ tx, index }))
    .filter(({ tx, index }) => !discardedIndices.has(index) && isLowConfidence(tx))

  if (pending.length === 0) return null

  const updateDraft = (index: number, field: (typeof EDITABLE_FIELDS)[number], value: string) => {
    setDrafts((prev) => ({ ...prev, [index]: { ...prev[index], [field]: field === "Amount" ? Number(value) || 0 : value } }))
  }

  const clearDraft = (index: number) => {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const handleSave = (index: number, tx: Transaction) => {
    // A row the user has looked at and corrected is no longer "low confidence" by definition.
    onSave(index, { ...tx, ...drafts[index], confidence: 1 })
    clearDraft(index)
    setExpandedIndex(null)
  }

  const handleConfirm = (index: number) => {
    onConfirm(index)
    clearDraft(index)
    setExpandedIndex(null)
  }

  return (
    <div className="card-bold bg-card p-4 text-card-foreground md:p-6">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-pop-orange">
          <AlertTriangle className="h-4 w-4 text-foreground" strokeWidth={2.5} />
        </div>
        <h3 className="font-display text-base font-bold text-foreground md:text-lg">Flagged for Review</h3>
        <span className="badge-bold flex h-6 min-w-6 items-center justify-center bg-pop-yellow px-1.5 text-xs font-bold text-foreground">
          {pending.length}
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground md:text-sm">
        These rows were extracted from manual notes or ambiguous messages. Check the original text, fix a detail if
        needed, or discard the row before exporting.
      </p>

      <div className="space-y-2">
        {pending.map(({ tx, index }) => {
          const isExpanded = expandedIndex === index
          const draft = { ...tx, ...drafts[index] }

          return (
            <div key={index} className="rounded-lg border-2 border-foreground bg-background">
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {tx["Paid To"] || "Unresolved recipient"} · Ksh {Number(tx.Amount || 0).toLocaleString()}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{tx.Purpose}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-3 border-t-2 border-foreground p-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Original Message</label>
                    <p className="whitespace-pre-wrap rounded-md border-2 border-foreground bg-muted p-2 text-xs text-foreground">
                      {tx.rawContent || "Original message not available for this row."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted-foreground">Amount</label>
                      <Input
                        type="number"
                        value={Number(draft.Amount ?? 0)}
                        onChange={(e) => updateDraft(index, "Amount", e.target.value)}
                        className="rounded-lg border-2 border-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted-foreground">Type</label>
                      <Input
                        value={String(draft.Type ?? "")}
                        onChange={(e) => updateDraft(index, "Type", e.target.value)}
                        className="rounded-lg border-2 border-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted-foreground">Paid To</label>
                      <Input
                        value={String(draft["Paid To"] ?? "")}
                        onChange={(e) => updateDraft(index, "Paid To", e.target.value)}
                        className="rounded-lg border-2 border-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-muted-foreground">Purpose</label>
                      <Input
                        value={String(draft.Purpose ?? "")}
                        onChange={(e) => updateDraft(index, "Purpose", e.target.value)}
                        className="rounded-lg border-2 border-foreground text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(index, tx)}
                      className="badge-bold gap-2 rounded-full bg-pop-teal font-bold text-foreground hover:bg-pop-teal/90"
                    >
                      <Check className="h-3.5 w-3.5" /> Save &amp; Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConfirm(index)}
                      className="badge-bold rounded-full bg-card font-bold"
                    >
                      Looks Correct As-Is
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDiscard(index)}
                      className="gap-2 font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Discard Row
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

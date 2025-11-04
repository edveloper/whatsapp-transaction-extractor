"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Copy, Check } from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  datePattern: string
  amountPattern: string
  referencePattern: string
  paidByPattern: string
  paidToPattern: string
}

interface TemplateBuilderProps {
  onTemplateSelect: (template: Template) => void
  currentTemplate?: Template
}

export default function TemplateBuilder({ onTemplateSelect, currentTemplate }: TemplateBuilderProps) {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "mpesa",
      name: "M-PESA",
      description: "M-PESA transaction pattern",
      datePattern: "\\d{1,2}/\\d{1,2}/\\d{4}",
      amountPattern: "(?:Ksh|KES)\\s*([0-9,]+(?:\\.\\d+)?)",
      referencePattern: "\\b([A-Z0-9]{8,12})\\b",
      paidByPattern: "sent\\s+by\\s+([^on]+)",
      paidToPattern: "sent\\s+to\\s+([^on]+)",
    },
    {
      id: "bank",
      name: "Bank Transfer",
      description: "Generic bank transfer pattern",
      datePattern: "\\d{2}-\\d{2}-\\d{4}",
      amountPattern: "(?:Amount|Credited?)\\s*(?:Ksh|KES|USD)?\\s*([0-9,]+(?:\\.\\d+)?)",
      referencePattern: "(?:Reference|Code):\\s*([A-Z0-9]{6,12})",
      paidByPattern: "(?:From|Sender):\\s*([A-Za-z\\s]+)",
      paidToPattern: "(?:To|Recipient):\\s*([A-Za-z\\s]+)",
    },
  ])
  const [showBuilder, setShowBuilder] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: "",
    description: "",
    datePattern: "",
    amountPattern: "",
    referencePattern: "",
    paidByPattern: "",
    paidToPattern: "",
  })
  const [copied, setCopied] = useState(false)

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.amountPattern) {
      alert("Please fill in template name and amount pattern")
      return
    }

    const template: Template = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name!,
      description: newTemplate.description || "",
      datePattern: newTemplate.datePattern || "",
      amountPattern: newTemplate.amountPattern!,
      referencePattern: newTemplate.referencePattern || "",
      paidByPattern: newTemplate.paidByPattern || "",
      paidToPattern: newTemplate.paidToPattern || "",
    }

    setTemplates([...templates, template])
    setNewTemplate({
      name: "",
      description: "",
      datePattern: "",
      amountPattern: "",
      referencePattern: "",
      paidByPattern: "",
      paidToPattern: "",
    })
    setShowBuilder(false)
  }

  const handleDeleteTemplate = (id: string) => {
    if (id === "mpesa" || id === "bank") {
      alert("Cannot delete built-in templates")
      return
    }
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const copyTemplate = (template: Template) => {
    const json = JSON.stringify(template, null, 2)
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-base md:text-lg">Extraction Templates</h3>
        <Button
          onClick={() => setShowBuilder(!showBuilder)}
          size="sm"
          variant={showBuilder ? "default" : "outline"}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Template Builder */}
      {showBuilder && (
        <div className="bg-secondary/30 p-4 rounded-lg mb-4 space-y-3">
          <Input
            placeholder="Template name (e.g., My Bank)"
            value={newTemplate.name || ""}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            className="text-sm"
          />

          <Input
            placeholder="Description (optional)"
            value={newTemplate.description || ""}
            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            className="text-sm"
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Amount Pattern (required)</label>
            <Input
              placeholder="e.g., (?:Amount|Ksh)\\s*([0-9,]+)"
              value={newTemplate.amountPattern || ""}
              onChange={(e) => setNewTemplate({ ...newTemplate, amountPattern: e.target.value })}
              className="text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date Pattern</label>
              <Input
                placeholder="e.g., \\d{1,2}/\\d{1,2}/\\d{4}"
                value={newTemplate.datePattern || ""}
                onChange={(e) => setNewTemplate({ ...newTemplate, datePattern: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Reference Pattern</label>
              <Input
                placeholder="e.g., \\b([A-Z0-9]{8,12})\\b"
                value={newTemplate.referencePattern || ""}
                onChange={(e) => setNewTemplate({ ...newTemplate, referencePattern: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Paid By Pattern</label>
              <Input
                placeholder="e.g., sent\\s+by\\s+([^on]+)"
                value={newTemplate.paidByPattern || ""}
                onChange={(e) => setNewTemplate({ ...newTemplate, paidByPattern: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Paid To Pattern</label>
              <Input
                placeholder="e.g., sent\\s+to\\s+([^on]+)"
                value={newTemplate.paidToPattern || ""}
                onChange={(e) => setNewTemplate({ ...newTemplate, paidToPattern: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleAddTemplate} className="flex-1 text-sm">
              Save Template
            </Button>
            <Button onClick={() => setShowBuilder(false)} variant="outline" className="flex-1 text-sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {templates.map((template) => (
          <div
            key={template.id}
            className="p-3 bg-card border border-border/50 rounded-lg hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{template.name}</p>
                {template.description && <p className="text-xs text-muted-foreground mt-1">{template.description}</p>}
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => copyTemplate(template)}
                  className="p-2 hover:bg-secondary rounded transition-colors"
                  title="Copy template"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {template.id.startsWith("custom-") && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 hover:bg-destructive/10 rounded transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                )}
              </div>
            </div>

            {/* Pattern Preview */}
            <div className="text-xs font-mono text-muted-foreground space-y-1 mb-2">
              {template.amountPattern && <p>Amount: {template.amountPattern.slice(0, 40)}...</p>}
              {template.datePattern && <p>Date: {template.datePattern.slice(0, 40)}...</p>}
            </div>

            <Button
              onClick={() => onTemplateSelect(template)}
              size="sm"
              variant={currentTemplate?.id === template.id ? "default" : "outline"}
              className="w-full text-xs"
            >
              {currentTemplate?.id === template.id ? "Currently Using" : "Use This Template"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Regex Patterns</p>
        <p>Use capturing groups () to extract values. Escape special chars with backslashes.</p>
      </div>
    </Card>
  )
}

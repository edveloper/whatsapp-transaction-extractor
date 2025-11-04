"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TemplateBuilder from "./template-builder"

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

interface TemplateSettingsModalProps {
  onTemplateSelect: (template: Template) => void
  currentTemplate?: Template
}

export default function TemplateSettingsModal({ onTemplateSelect, currentTemplate }: TemplateSettingsModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="gap-2">
        <Settings className="w-4 h-4" />
        Extraction Templates
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Extraction Templates</DialogTitle>
          </DialogHeader>

          <TemplateBuilder
            onTemplateSelect={(template) => {
              onTemplateSelect(template)
              setOpen(false)
            }}
            currentTemplate={currentTemplate}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

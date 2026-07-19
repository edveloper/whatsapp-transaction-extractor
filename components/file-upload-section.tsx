"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { AlertCircle, ArrowDown, FileText, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface FileUploadSectionProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export default function FileUploadSection({ onFileUpload, isLoading }: FileUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState("")
  const acceptedFormats = ".txt"

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      setError("")

      const files = e.dataTransfer.files
      if (files.length === 0) return

      const file = files[0]
      if (acceptedFormats.split(",").some((fmt) => file.name.endsWith(fmt))) {
        onFileUpload(file)
        return
      }

      setError(`Please drop a valid WhatsApp .txt export. Accepted: ${acceptedFormats}`)
    },
    [acceptedFormats, onFileUpload],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files?.[0]) return

    setError("")
    onFileUpload(files[0])
  }

  return (
    <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="order-2 space-y-6 lg:order-1">
        <div>
          <h2 className="mb-3 text-balance font-display text-3xl font-bold leading-[1.1] text-foreground md:text-4xl">
            Extract transactions from{" "}
            <span className="inline-block -rotate-1 rounded-lg border-2 border-foreground bg-pop-teal px-2 py-0.5 text-foreground">
              WhatsApp chats
            </span>
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Upload your WhatsApp chat export and extract transaction details into a clean CSV. This version is focused
            on WhatsApp `.txt` exports only.
          </p>
        </div>

        <div>
          <span className="badge-bold mb-3 inline-block bg-pop-yellow px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground">
            What Happens to a Message
          </span>
          <Card className="card-bold p-4">
            <div className="rounded-lg rounded-bl-sm border-2 border-foreground bg-pop-teal/25 p-3 text-sm">
              <p className="mb-1 text-[10px] font-bold text-foreground">Auntie Jane · 18/08, 10:20am</p>
              <p className="text-foreground">
                TX7F9K2M1P Confirmed. 5,000.00 KSH sent to John Mwangi, 0722***456 via M-PESA App.
              </p>
            </div>
            <div className="flex justify-center py-1 text-primary">
              <ArrowDown className="h-5 w-5" strokeWidth={3} />
            </div>
            <div className="space-y-1.5 rounded-lg border-2 border-foreground bg-card p-3 text-xs">
              <div className="flex justify-between border-b border-dashed border-border pb-1.5">
                <span className="font-bold text-foreground">Amount</span>
                <span className="font-mono text-foreground">Ksh 5,000</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-border pb-1.5">
                <span className="font-bold text-foreground">Paid to</span>
                <span className="text-foreground">John Mwangi</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-border pb-1.5">
                <span className="font-bold text-foreground">Reference</span>
                <span className="font-mono text-foreground">TX7F9K2M1P</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-foreground">Type</span>
                <span className="text-foreground">M-PESA</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="order-1 lg:order-2">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="h-full">
          <Card
            className={`card-bold flex cursor-pointer flex-col items-center justify-center gap-4 border-dashed p-6 transition-colors md:p-8 lg:p-12 ${
              isDragging ? "bg-primary/10" : "hover:bg-primary/5"
            }`}
          >
            <input ref={inputRef} type="file" accept={acceptedFormats} onChange={handleFileSelect} className="hidden" />

            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground bg-pop-orange md:h-20 md:w-20">
              <Upload className="h-7 w-7 text-foreground md:h-9 md:w-9" strokeWidth={2.5} />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">Drag and drop your file</h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                or click to select a WhatsApp export ({acceptedFormats})
              </p>
            </div>

            <Button
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="badge-bold mt-4 w-full rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90 md:w-auto"
              size="lg"
            >
              {isLoading ? "Processing..." : "Select File"}
            </Button>

            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground md:mt-4">
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span>Maximum file size: 50MB</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

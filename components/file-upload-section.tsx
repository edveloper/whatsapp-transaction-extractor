"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { AlertCircle, FileText, Upload } from "lucide-react"
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
          <h2 className="mb-3 text-2xl font-bold text-foreground text-balance md:text-3xl">
            Extract Transactions From WhatsApp Chats
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Upload your WhatsApp chat export and extract transaction details into a clean CSV. This version is focused
            on WhatsApp `.txt` exports only.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground md:text-base">Export Chat</h3>
              <p className="text-xs text-muted-foreground md:text-sm">Use a WhatsApp chat export without media</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground md:text-base">Upload .txt File</h3>
              <p className="text-xs text-muted-foreground md:text-sm">Drag and drop or select the exported chat file</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground md:text-base">Download CSV</h3>
              <p className="text-xs text-muted-foreground md:text-sm">Review the table, then export your results</p>
            </div>
          </div>
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
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed bg-card/30 p-6 backdrop-blur-sm transition-colors md:p-8 lg:p-12 ${
              isDragging ? "border-primary/80 bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-card/50"
            }`}
          >
            <input ref={inputRef} type="file" accept={acceptedFormats} onChange={handleFileSelect} className="hidden" />

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 md:h-16 md:w-16">
              <Upload className="h-6 w-6 text-primary md:h-8 md:w-8" />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-lg font-bold text-foreground md:text-xl">Drag and drop your file</h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                or click to select a WhatsApp export ({acceptedFormats})
              </p>
            </div>

            <Button
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 md:w-auto"
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

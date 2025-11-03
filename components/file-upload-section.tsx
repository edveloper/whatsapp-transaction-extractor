"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadSectionProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export default function FileUploadSection({ onFileUpload, isLoading }: FileUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState("")

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
      if (files.length > 0) {
        if (files[0].name.endsWith(".txt")) {
          onFileUpload(files[0])
        } else {
          setError("Please drop a .txt file. Got: " + files[0].name)
        }
      }
    },
    [onFileUpload],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files[0]) {
      setError("")
      onFileUpload(files[0])
    }
  }

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 items-center">
      {/* Left - Info Card */}
      <div className="space-y-6 order-2 lg:order-1">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
            Extract Transactions Effortlessly
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Upload your WhatsApp chat export and instantly extract transaction details into a clean, organized CSV file.
            Supports M-Pesa, bank transfers, cash payments, and remittance services.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">Upload WhatsApp Export</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Export your chat as a .txt file from WhatsApp</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">Preview & Customize</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Review extracted transactions and adjust columns
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">Download CSV</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Get your organized data ready to use</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="h-full order-1 lg:order-2"
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card
          className={`border-2 border-dashed transition-colors p-6 md:p-8 lg:p-12 cursor-pointer bg-card/30 backdrop-blur-sm h-full flex flex-col items-center justify-center gap-4 ${
            isDragging ? "border-primary/80 bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-card/50"
          }`}
        >
          <input ref={inputRef} type="file" accept=".txt" onChange={handleFileSelect} className="hidden" />

          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg md:text-xl font-bold text-foreground">Drag and drop your file</h3>
            <p className="text-xs md:text-sm text-muted-foreground">or click to select a WhatsApp chat export (.txt)</p>
          </div>

          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto"
            size="lg"
          >
            {isLoading ? "Processing..." : "Select File"}
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 md:mt-4">
            <FileText className="w-3 h-3 md:w-4 md:h-4" />
            <span>Maximum file size: 50MB</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

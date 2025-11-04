"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import SourceSelector from "./source-selector"

interface FileEntry {
  id: string
  file: File
  source: "whatsapp" | "email" | "telegram" | "pdf"
  status: "pending" | "processing" | "done" | "error"
}

interface MultiFileUploadProps {
  onFilesReady: (files: FileEntry[]) => void
  isProcessing: boolean
}

export default function MultiFileUpload({ onFilesReady, isProcessing }: MultiFileUploadProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [selectedSource, setSelectedSource] = useState<"whatsapp" | "email" | "telegram" | "pdf">("whatsapp")
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptedFormats = {
    whatsapp: ".txt",
    email: ".txt,.eml",
    telegram: ".txt,.json",
    pdf: ".pdf",
  }[selectedSource]

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      setError("")

      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    },
    [selectedSource],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files) {
      addFiles(Array.from(e.currentTarget.files))
    }
  }

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const isValidFormat = acceptedFormats.split(",").some((fmt) => file.name.endsWith(fmt))
      return isValidFormat
    })

    if (validFiles.length !== newFiles.length) {
      setError(`Some files were skipped. Only ${acceptedFormats} files are accepted for ${selectedSource}.`)
    }

    const entries: FileEntry[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      source: selectedSource,
      status: "pending" as const,
    }))

    setFiles((prev) => [...prev, ...entries])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const processFiles = async () => {
    if (files.length === 0) return

    onFilesReady(files)
  }

  return (
    <div className="space-y-6">
      {/* File List */}
      {files.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="font-semibold text-foreground mb-4">Files to Process ({files.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.source.charAt(0).toUpperCase() + entry.source.slice(1)} •
                    {(entry.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(entry.id)}
                  disabled={isProcessing}
                  className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card className="p-6 md:p-8">
        <h3 className="font-semibold text-foreground mb-4">Add More Files</h3>

        <SourceSelector selectedSource={selectedSource} onSourceChange={setSelectedSource} />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging ? "border-primary/80 bg-primary/5" : "border-border/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFormats}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />

          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mb-1">Drag files here or click to browse</p>
          <p className="text-xs text-muted-foreground mb-4">Accepted: {acceptedFormats}</p>

          <Button onClick={() => inputRef.current?.click()} variant="outline" size="sm">
            Select Files
          </Button>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={processFiles} disabled={files.length === 0 || isProcessing} className="flex-1 gap-2">
          <Plus className="w-4 h-4" />
          {isProcessing ? "Processing..." : `Process ${files.length} File${files.length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  )
}

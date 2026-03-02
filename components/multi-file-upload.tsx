"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { Plus, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface FileEntry {
  id: string
  file: File
}

interface MultiFileUploadProps {
  onFilesReady: (files: File[]) => void
  isProcessing: boolean
}

export default function MultiFileUpload({ onFilesReady, isProcessing }: MultiFileUploadProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const acceptedFormats = ".txt"

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => acceptedFormats.split(",").some((fmt) => file.name.endsWith(fmt)))

    if (validFiles.length !== newFiles.length) {
      setError("Some files were skipped. Only WhatsApp .txt exports are accepted.")
    }

    const entries: FileEntry[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
    }))

    setFiles((prev) => [...prev, ...entries])
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      setError("")
      addFiles(Array.from(e.dataTransfer.files))
    },
    [acceptedFormats],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.currentTarget.files) return
    addFiles(Array.from(e.currentTarget.files))
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-6">
      {files.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="mb-4 font-semibold text-foreground">Files to Process ({files.length})</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {files.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{entry.file.name}</p>
                  <p className="text-xs text-muted-foreground">WhatsApp chat - {(entry.file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => removeFile(entry.id)}
                  disabled={isProcessing}
                  className="ml-2 rounded p-1 transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6 md:p-8">
        <h3 className="mb-4 font-semibold text-foreground">Add More Files</h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
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

          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium text-foreground">Drag files here or click to browse</p>
          <p className="mb-4 text-xs text-muted-foreground">Accepted: WhatsApp .txt exports</p>

          <Button onClick={() => inputRef.current?.click()} variant="outline" size="sm">
            Select Files
          </Button>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={() => onFilesReady(files.map((entry) => entry.file))}
          disabled={files.length === 0 || isProcessing}
          className="flex-1 gap-2"
        >
          <Plus className="h-4 w-4" />
          {isProcessing ? "Processing..." : `Process ${files.length} Chat${files.length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import FileUploadSection from "@/components/file-upload-section"
import PreviewDashboard from "@/components/preview-dashboard"
import HelpModal from "@/components/help-modal"

export default function Home() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState("")

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Extraction failed")
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to extract transactions. Please check the file format.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">tx</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">TransactionExtract</h1>
              <p className="text-sm text-muted-foreground">WhatsApp Chat to CSV</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {transactions.length === 0 ? (
          <FileUploadSection onFileUpload={handleFileUpload} isLoading={isLoading} />
        ) : (
          <PreviewDashboard
            transactions={transactions}
            fileName={fileName}
            onReset={() => {
              setTransactions([])
              setFileName("")
            }}
          />
        )}
      </main>

      {/* Help Modal */}
      <HelpModal />

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-sm text-muted-foreground text-center">
            Securely process your WhatsApp exports locally. No data is stored.
          </p>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState } from "react"
import FileUploadSection from "@/components/file-upload-section"
import MultiFileUpload from "@/components/multi-file-upload"
import PreviewDashboard from "@/components/preview-dashboard"
import HelpModal from "@/components/help-modal"
import TemplateSettingsModal from "@/components/template-settings-modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Merge as Merge2 } from "lucide-react"

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

export default function Home() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [uploadMode, setUploadMode] = useState<"single" | "multi">("single")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | undefined>(undefined)

  const handleFileUpload = async (file: File, source: string) => {
    setIsLoading(true)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("source", source)
      if (selectedTemplate) {
        formData.append("template", JSON.stringify(selectedTemplate))
      }

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

  const handleMultiFileProcess = async (fileEntries: any[]) => {
    setIsLoading(true)
    setFileName(`${fileEntries.length} files merged`)

    try {
      const allTransactions: any[] = []

      for (const entry of fileEntries) {
        const formData = new FormData()
        formData.append("file", entry.file)
        formData.append("source", entry.source)
        if (selectedTemplate) {
          formData.append("template", JSON.stringify(selectedTemplate))
        }

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          allTransactions.push(...(data.transactions || []))
        }
      }

      allTransactions.sort((a, b) => {
        const dateA = new Date(String(a.Date || 0)).getTime()
        const dateB = new Date(String(b.Date || 0)).getTime()
        return dateB - dateA
      })

      setTransactions(allTransactions)
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to merge transactions. Please check the files.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">tx</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">TransactionExtract</h1>
                <p className="text-sm text-muted-foreground">Multi-source Transaction Parser</p>
              </div>
            </div>
            <TemplateSettingsModal onTemplateSelect={setSelectedTemplate} currentTemplate={selectedTemplate} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {transactions.length === 0 ? (
          <Tabs value={uploadMode} onValueChange={(val) => setUploadMode(val as "single" | "multi")} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="single">Single File</TabsTrigger>
              <TabsTrigger value="multi" className="gap-2">
                <Merge2 className="w-4 h-4" />
                Merge Multiple
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <FileUploadSection onFileUpload={handleFileUpload} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="multi">
              <Card className="p-6 md:p-8 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <Merge2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">Merge Multiple Files</h2>
                    <p className="text-base md:text-lg text-muted-foreground mt-1">
                      Upload transactions from different sources (WhatsApp, Email, etc.) and merge them into one
                      organized dataset.
                    </p>
                  </div>
                </div>
              </Card>

              <MultiFileUpload onFilesReady={handleMultiFileProcess} isProcessing={isLoading} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4 mb-6">
            <Button
              onClick={() => {
                setTransactions([])
                setFileName("")
                setUploadMode("single")
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Upload Another File
            </Button>
          </div>
        )}

        {transactions.length > 0 && (
          <PreviewDashboard
            transactions={transactions}
            fileName={fileName}
            onReset={() => {
              setTransactions([])
              setFileName("")
              setUploadMode("single")
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
            Securely process your data locally. No information is stored or transmitted.
          </p>
        </div>
      </footer>
    </div>
  )
}

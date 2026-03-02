"use client"

import { useState } from "react"
import { Merge as Merge2, Sparkles } from "lucide-react"
import FileUploadSection from "@/components/file-upload-section"
import MultiFileUpload from "@/components/multi-file-upload"
import PreviewDashboard from "@/components/preview-dashboard"
import HelpModal from "@/components/help-modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { type Transaction } from "@/components/transaction-table"

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [uploadMode, setUploadMode] = useState<"single" | "multi">("single")

  const resetToUpload = () => {
    setTransactions([])
    setFileName("")
    setUploadMode("single")
  }

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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Extraction failed")
      }

      setTransactions(data.transactions || [])
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to extract transactions.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMultiFileProcess = async (files: File[]) => {
    setIsLoading(true)
    setFileName(`${files.length} WhatsApp chats merged`)

    try {
      const allTransactions: Transaction[] = []
      const failedFiles: string[] = []

      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          failedFiles.push(file.name)
          continue
        }

        const data = await response.json()
        allTransactions.push(...(data.transactions || []))
      }

      if (allTransactions.length === 0) {
        throw new Error("None of the selected chats could be processed.")
      }

      allTransactions.sort((a, b) => {
        const timeA = new Date(a.Date).getTime() || 0
        const timeB = new Date(b.Date).getTime() || 0
        return timeB - timeA
      })

      setTransactions(allTransactions)

      if (failedFiles.length > 0) {
        toast({
          variant: "destructive",
          title: "Some chats were skipped",
          description: `Failed to process ${failedFiles.length} file(s): ${failedFiles.join(", ")}`,
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Merge failed",
        description: error instanceof Error ? error.message : "Failed to merge chats.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <span className="text-lg font-bold text-primary-foreground">tx</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">TransactionExtract</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary sm:px-2 sm:py-0.5">
                    <Sparkles className="h-3 w-3" />
                    <span className="sm:hidden">AI</span>
                    <span className="hidden sm:inline">AI Enhanced</span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">WhatsApp chat transaction extractor</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {transactions.length === 0 ? (
          <Tabs value={uploadMode} onValueChange={(val) => setUploadMode(val as "single" | "multi")} className="w-full">
            <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="single">Single File</TabsTrigger>
              <TabsTrigger value="multi" className="gap-2">
                <Merge2 className="h-4 w-4" />
                Merge Chats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <FileUploadSection onFileUpload={handleFileUpload} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="multi">
              <Card className="mb-6 border-2 border-dashed p-6 md:p-8">
                <div className="mb-6 flex items-start gap-3">
                  <Merge2 className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Merge WhatsApp Chats</h2>
                    <p className="mt-1 text-muted-foreground">
                      Combine multiple WhatsApp exports into one transaction view.
                    </p>
                  </div>
                </div>
                <MultiFileUpload onFilesReady={handleMultiFileProcess} isProcessing={isLoading} />
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <Button onClick={resetToUpload} variant="ghost" className="gap-2">
              Back to Upload
            </Button>

            <PreviewDashboard transactions={transactions} fileName={fileName} onReset={resetToUpload} />
          </div>
        )}
      </main>

      <HelpModal />

      <footer className="mt-16 border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            Chat parsing runs on the server. AI enrichment is capped at the first 10 extracted transactions.
          </p>
        </div>
      </footer>
    </div>
  )
}

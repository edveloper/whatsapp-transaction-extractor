"use client"

import { useState } from "react"
import { Merge as Merge2 } from "lucide-react"
import FileUploadSection from "@/components/file-upload-section"
import MultiFileUpload from "@/components/multi-file-upload"
import PreviewDashboard from "@/components/preview-dashboard"
import HelpModal from "@/components/help-modal"
import TrustNote from "@/components/trust-note"
import LimitsNote from "@/components/limits-note"
import FormatReference from "@/components/format-reference"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-screen bg-background">
      <div className="flex h-1.5 w-full">
        <span className="flex-1 bg-pop-teal" />
        <span className="flex-1 bg-pop-pink" />
        <span className="flex-1 bg-pop-yellow" />
        <span className="flex-1 bg-pop-orange" />
        <span className="flex-1 bg-pop-purple" />
      </div>
      <header className="sticky top-0 z-50 border-b-2 border-foreground bg-card">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 rotate-[-4deg] items-center justify-center rounded-xl border-2 border-foreground bg-primary">
                <svg width="22" height="22" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                  <path d="M4 4h26v22l-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3V4z" fill="currentColor" className="text-primary-foreground" />
                  <path d="M10 13l3.5 3.5L18 11" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">daftari</h1>
                <p className="text-sm text-muted-foreground">Every shilling, written down.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {transactions.length === 0 ? (
          <>
            <Tabs value={uploadMode} onValueChange={(val) => setUploadMode(val as "single" | "multi")} className="w-full">
              <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2 rounded-full border-2 border-foreground bg-card p-1">
                <TabsTrigger
                  value="single"
                  className="rounded-full font-bold data-[state=active]:border-2 data-[state=active]:border-foreground data-[state=active]:bg-pop-yellow data-[state=active]:shadow-none"
                >
                  Single File
                </TabsTrigger>
                <TabsTrigger
                  value="multi"
                  className="gap-2 rounded-full font-bold data-[state=active]:border-2 data-[state=active]:border-foreground data-[state=active]:bg-pop-yellow data-[state=active]:shadow-none"
                >
                  <Merge2 className="h-4 w-4" />
                  Merge Chats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <FileUploadSection onFileUpload={handleFileUpload} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="multi">
                <div className="card-bold mb-6 border-dashed bg-card p-6 text-card-foreground md:p-8">
                  <div className="mb-6 flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 rotate-3 items-center justify-center rounded-full border-2 border-foreground bg-pop-purple">
                      <Merge2 className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-foreground">Merge WhatsApp Chats</h2>
                      <p className="mt-1 text-muted-foreground">
                        Combine multiple WhatsApp exports into one transaction view.
                      </p>
                    </div>
                  </div>
                  <MultiFileUpload onFilesReady={handleMultiFileProcess} isProcessing={isLoading} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mx-auto mt-16 max-w-3xl space-y-6">
              <TrustNote />
              <div className="grid gap-6 md:grid-cols-2">
                <LimitsNote />
                <FormatReference />
              </div>
            </div>
          </>
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

      <div className="mt-16 flex h-1.5 w-full">
        <span className="flex-1 bg-pop-purple" />
        <span className="flex-1 bg-pop-orange" />
        <span className="flex-1 bg-pop-yellow" />
        <span className="flex-1 bg-pop-pink" />
        <span className="flex-1 bg-pop-teal" />
      </div>
      <footer className="border-t-2 border-foreground bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            Chat parsing runs on the server, not a third party. AI is only used to help categorize the transactions
            we&apos;re least confident about, capped at 10 per upload.
          </p>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState } from "react"
import { FileText, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HelpModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary p-0 text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How to Use TransactionExtract</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="export" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="export">Export Chat</TabsTrigger>
              <TabsTrigger value="usage">How to Use</TabsTrigger>
              <TabsTrigger value="mobile">Mobile Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    For Android Users
                  </h3>
                  <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                    <li>Open the WhatsApp group or chat with transactions</li>
                    <li>Tap the three dots menu at the top right</li>
                    <li>Select "More" then "Export chat"</li>
                    <li>Choose "Without media" for a `.txt` file</li>
                    <li>Save the export to your device</li>
                  </ol>
                </div>

                <div>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    For iOS Users
                  </h3>
                  <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                    <li>Open the WhatsApp group or chat</li>
                    <li>Tap the chat name at the top</li>
                    <li>Scroll down and select "Export Chat"</li>
                    <li>Choose the "Without Media" option</li>
                    <li>Save the file to Files so you can upload the `.txt` export</li>
                  </ol>
                </div>

                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="mb-1 font-semibold text-amber-900">Pro Tip:</p>
                  <p className="text-amber-800">
                    Include enough chat history to capture the transactions you care about, but expect slower processing
                    on very large exports.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Step 1: Upload Your Chat</h3>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Drag and drop your WhatsApp `.txt` export onto the upload area, or click to browse.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Step 2: Review Transactions</h3>
                  <p className="mb-2 text-sm text-muted-foreground">
                    The app scans WhatsApp messages for transaction-like entries and builds a reviewable table before
                    export.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Step 3: Customize Columns</h3>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Click "Customize Columns" to show or hide fields and rename headers to match your workflow.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Step 4: Download CSV</h3>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Download the extracted transactions as a spreadsheet-ready CSV or JSON export.
                  </p>
                </div>

                <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">
                  <p className="mb-1 font-semibold text-blue-900">Supported Patterns:</p>
                  <ul className="list-inside list-disc space-y-1 text-blue-800">
                    <li>M-PESA transfers and confirmations</li>
                    <li>Manual payment logs shared in chat</li>
                    <li>Common amount and reference patterns found in WhatsApp exports</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mobile" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Using on Phone or Tablet</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    The app is mobile-friendly. These tips make the review flow easier on smaller screens.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="text-lg font-bold text-primary">1</div>
                    <div>
                      <p className="text-sm font-semibold">Tap to Upload</p>
                      <p className="text-xs text-muted-foreground">
                        Tap the upload area to select your exported chat from Files or Downloads.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-lg font-bold text-primary">2</div>
                    <div>
                      <p className="text-sm font-semibold">Scroll Tables Horizontally</p>
                      <p className="text-xs text-muted-foreground">
                        Swipe left and right if the table has more columns than fit on screen.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-lg font-bold text-primary">3</div>
                    <div>
                      <p className="text-sm font-semibold">Download CSV</p>
                      <p className="text-xs text-muted-foreground">
                        The exported file will appear in your Downloads location for sharing or spreadsheet import.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-lg font-bold text-primary">4</div>
                    <div>
                      <p className="text-sm font-semibold">Merge Multiple Chats</p>
                      <p className="text-xs text-muted-foreground">
                        Use the merge view to combine more than one WhatsApp export into one table.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                  <p className="mb-1 font-semibold text-green-900">Best Practice:</p>
                  <p className="text-green-800">
                    Export the chat on your phone, upload the `.txt` file here, then import the CSV into Google
                    Sheets or Excel.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

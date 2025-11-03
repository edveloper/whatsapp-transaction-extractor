"use client"

import { useState } from "react"
import { HelpCircle, FileText } from "lucide-react"
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
        className="fixed bottom-4 right-4 rounded-full w-10 h-10 p-0 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    For Android Users
                  </h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Open the WhatsApp group/chat with transactions</li>
                    <li>Tap the three dots menu (⋮) at the top right</li>
                    <li>Select "More" → "Export chat"</li>
                    <li>Choose "Without media" for a .txt file</li>
                    <li>Save the file to your device</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    For iOS Users
                  </h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Open the WhatsApp group/chat</li>
                    <li>Tap the chat name at the top</li>
                    <li>Scroll down and select "Export Chat"</li>
                    <li>Choose "Without Media" option</li>
                    <li>Use "Save to Files" or send via email to access the .txt</li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <p className="font-semibold text-amber-900 mb-1">Pro Tip:</p>
                  <p className="text-amber-800">
                    Include transactions from the last few months in your export for better accuracy. The more data, the
                    better the extraction.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Step 1: Upload Your Chat</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your WhatsApp .txt export file onto the upload area, or click to browse.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 2: Review Transactions</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    The app automatically extracts transactions for M-Pesa, Bank transfers, Remittance services
                    (WorldRemit, Remitly, Wise), and Cash payments.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 3: Customize Columns</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click "Customize Columns" to show/hide fields and rename headers to match your preferences.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 4: Download CSV</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click "Download CSV" to get your extracted transactions as a spreadsheet-ready file.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Supported Transactions:</p>
                  <ul className="text-blue-800 space-y-1 list-disc list-inside">
                    <li>M-PESA transfers & confirmations</li>
                    <li>Bank transfers & deposits</li>
                    <li>Remittance services (WorldRemit, Remitly, Wise, etc.)</li>
                    <li>Cash payments & manual entries</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mobile" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Using on Phone/Tablet</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This app is fully optimized for mobile devices. Here are some tips:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="text-primary font-bold text-lg">📱</div>
                    <div>
                      <p className="font-semibold text-sm">Tap to Upload</p>
                      <p className="text-xs text-muted-foreground">
                        Simply tap the upload area to select a file from your phone
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-primary font-bold text-lg">📊</div>
                    <div>
                      <p className="font-semibold text-sm">Scroll Tables Horizontally</p>
                      <p className="text-xs text-muted-foreground">
                        If the table is wide, swipe left/right to see all columns
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-primary font-bold text-lg">⬇️</div>
                    <div>
                      <p className="font-semibold text-sm">Download CSV</p>
                      <p className="text-xs text-muted-foreground">
                        The downloaded CSV will appear in your Downloads folder for easy sharing
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-primary font-bold text-lg">🔄</div>
                    <div>
                      <p className="font-semibold text-sm">Process Multiple Chats</p>
                      <p className="text-xs text-muted-foreground">
                        Click "New File" to upload another chat export and extract more transactions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                  <p className="font-semibold text-green-900 mb-1">Best Practice:</p>
                  <p className="text-green-800">
                    Export your chat on your phone, download the CSV, then import it into your spreadsheet app (Google
                    Sheets, Excel, etc.) directly from your device.
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

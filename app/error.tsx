"use client"

import { useEffect } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="card-bold max-w-md bg-card p-6 text-card-foreground">
        <h1 className="font-display text-2xl font-bold text-foreground">Something Went Wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          daftari hit an unexpected error while processing that. Your file was not saved anywhere, so it&apos;s safe to
          try again.
        </p>
        <Button onClick={reset} className="badge-bold mt-5 gap-2 rounded-full bg-primary font-bold">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}

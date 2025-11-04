"use client"
import { Mail, MessageSquare, FileJson } from "lucide-react"

interface SourceSelectorProps {
  selectedSource: "whatsapp" | "email" | "telegram" | "pdf"
  onSourceChange: (source: "whatsapp" | "email" | "telegram" | "pdf") => void
}

export default function SourceSelector({ selectedSource, onSourceChange }: SourceSelectorProps) {
  const sources = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageSquare,
      description: "Chat exports from WhatsApp",
      color: "bg-green-500/10 border-green-500/20",
      activeColor: "bg-green-500/20 border-green-500/50",
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      description: "Bank statements & transaction emails",
      color: "bg-blue-500/10 border-blue-500/20",
      activeColor: "bg-blue-500/20 border-blue-500/50",
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: MessageSquare,
      description: "Message exports from Telegram",
      color: "bg-cyan-500/10 border-cyan-500/20",
      activeColor: "bg-cyan-500/20 border-cyan-500/50",
    },
    {
      id: "pdf",
      label: "PDF",
      icon: FileJson,
      description: "Statements & receipts from PDFs",
      color: "bg-red-500/10 border-red-500/20",
      activeColor: "bg-red-500/20 border-red-500/50",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {sources.map((source) => {
        const Icon = source.icon
        const isSelected = selectedSource === source.id

        return (
          <button
            key={source.id}
            onClick={() => onSourceChange(source.id as any)}
            className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
              isSelected ? `${source.activeColor} ring-2 ring-offset-2 ring-offset-background` : source.color
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Icon className="w-6 h-6" />
              <div className="text-center">
                <p className="font-semibold text-xs md:text-sm">{source.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{source.description}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

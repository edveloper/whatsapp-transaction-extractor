import { Bot, Eye, Lock } from "lucide-react"

const POINTS = [
  {
    icon: Lock,
    color: "bg-pop-teal",
    title: "Never Saved",
    body: "Your chat is parsed in memory and discarded. Nothing is written to a database or disk.",
  },
  {
    icon: Bot,
    color: "bg-pop-pink",
    title: "AI Used Sparingly",
    body: "Only the handful of transactions we can't confidently match are sent to Google's AI for help categorizing them. Everything else is matched entirely on our server.",
  },
  {
    icon: Eye,
    color: "bg-pop-yellow",
    title: "You Verify It",
    body: "Anything uncertain lands in the Review Queue for you to confirm before it's exported.",
  },
]

export default function TrustNote() {
  return (
    <div className="card-bold grid divide-y-2 divide-foreground bg-card text-card-foreground md:grid-cols-3 md:divide-x-2 md:divide-y-0">
      {POINTS.map(({ icon: Icon, color, title, body }) => (
        <div key={title} className="p-5">
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground ${color}`}>
            <Icon className="h-5 w-5 text-foreground" strokeWidth={2.25} />
          </div>
          <h3 className="mb-1.5 font-display text-base font-bold text-foreground">{title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
        </div>
      ))}
    </div>
  )
}

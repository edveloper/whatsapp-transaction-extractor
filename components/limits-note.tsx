const LIMITS = [
  {
    color: "bg-pop-pink",
    text: `Casual mentions of money ("would 200k be too much?") are filtered out, but the filter isn't perfect.`,
    sub: "Anything ambiguous is flagged for review, not silently guessed.",
  },
  {
    color: "bg-pop-orange",
    text: "Multi-item cost breakdowns in one message use the stated total, not a full line-by-line split.",
    sub: "You can still see the original message and correct it by hand.",
  },
  {
    color: "bg-pop-purple",
    text: "Foreign-currency remittances are flagged, not auto-converted.",
    sub: "We don't guess an exchange rate. That's your call.",
  },
]

export default function LimitsNote() {
  return (
    <div className="card-bold bg-card p-5 text-card-foreground md:p-6">
      <h3 className="mb-1 font-display text-base font-bold text-foreground">What It Won&apos;t Get Right</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        A tool that admits its limits is more useful than one that pretends to be perfect, especially with money.
      </p>
      <div className="divide-y divide-border">
        {LIMITS.map(({ color, text, sub }) => (
          <div key={text} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full border border-foreground ${color}`} aria-hidden="true" />
            <div className="text-sm text-foreground">
              {text}
              <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

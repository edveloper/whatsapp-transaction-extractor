const FORMATS = [
  { tag: "M-PESA", color: "bg-pop-teal", sample: `"QA1B2C3D4E Confirmed. 8,500.00 KSH sent to..."` },
  { tag: "Bank Alert", color: "bg-pop-pink", sample: `"...you have successfully transferred KES 42,000 to..."` },
  { tag: "Manual Note", color: "bg-pop-orange", sample: `"20000 given to Peter for roofing materials"` },
  { tag: "Tax Payment", color: "bg-pop-purple", sample: `"...Payment Ref: ABCDEFGH for E-Slip No. ... of KES 3,200.00..."` },
]

export default function FormatReference() {
  return (
    <div className="card-bold bg-card p-5 text-card-foreground md:p-6">
      <h3 className="mb-1 font-display text-base font-bold text-foreground">What It Recognizes</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        A quick reference before you upload: real message shapes daftari already knows how to read.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {FORMATS.map(({ tag, color, sample }) => (
          <div key={tag} className="rounded-lg border-2 border-foreground bg-background p-3">
            <span className={`badge-bold mb-1.5 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground ${color}`}>
              {tag}
            </span>
            <p className="text-xs italic leading-relaxed text-muted-foreground">{sample}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

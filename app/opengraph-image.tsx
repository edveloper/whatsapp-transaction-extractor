import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5efdd",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 140,
            height: 140,
            borderRadius: 28,
            border: "5px solid #1e2a22",
            backgroundColor: "#1f7a4d",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            transform: "rotate(-4deg)",
          }}
        >
          <svg width="76" height="76" viewBox="0 0 34 34" fill="none">
            <path
              d="M4 4h26v22l-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3V4z"
              fill="#f5efdd"
            />
            <path
              d="M10 13l3.5 3.5L18 11"
              stroke="#1f7a4d"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#1e2a22" }}>daftari</div>
        <div style={{ display: "flex", fontSize: 34, color: "#6e6a56", marginTop: 16 }}>Every shilling, written down.</div>
      </div>
    ),
    { ...size },
  )
}

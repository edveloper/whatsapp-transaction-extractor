/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevents MIME-sniffing a response away from its declared content-type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Blocks this site from being framed by another origin (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Don't leak the full upload URL (which could end up containing query params later) to
          // third-party resources on outbound links.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No reason for this app to use the camera/mic/geolocation APIs.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig

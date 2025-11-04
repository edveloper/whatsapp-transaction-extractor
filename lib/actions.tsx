"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Email addresses
const RECIPIENT_EMAILS = ["info@goldeneagle.co.ke", "goldeneagleinsagency@gmail.com"]
const FROM_EMAIL = "noreply@resend.dev"

interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

interface QuoteFormData {
  name: string
  email: string
  phone: string
  insuranceType: string
  message?: string
}

export async function submitContactForm(data: ContactFormData) {
  try {
    console.log("[v0] Contact form submission received:", { name: data.name, email: data.email })

    // Send notification to admin
    const adminEmail = await resend.emails.send({
      from: FROM_EMAIL,
      to: RECIPIENT_EMAILS,
      subject: `New Contact Form Submission - ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1a3a5c;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${data.message}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">This email was sent from www.goldeneagleltd.com contact form</p>
        </div>
      `,
    })

    console.log("[v0] Admin notification sent:", adminEmail)

    // Send confirmation to user
    const userEmail = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: "We Received Your Message - Golden Eagle Insurance",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1a3a5c;">Thank You for Contacting Us!</h2>
          <p>Hi ${data.name},</p>
          <p>We've received your message and appreciate you reaching out to Golden Eagle Insurance. Our team will review your inquiry and get back to you within 24 business hours.</p>
          <p><strong>Your Message Details:</strong></p>
          <p>Subject: ${data.subject}</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${data.message}</p>
          <p>In the meantime, if you have any urgent matters, please feel free to call us:</p>
          <p>
            +254 722 518 485<br />
            +254 733 606 661<br />
            +254 20 2606 661
          </p>
          <hr />
          <p style="color: #666; font-size: 12px;">Golden Eagle Insurance - Your Partner in Protection</p>
        </div>
      `,
    })

    console.log("[v0] User confirmation email sent:", userEmail)

    return { success: true }
  } catch (error) {
    console.error("[v0] Contact form email error - Full details:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function submitQuoteForm(data: QuoteFormData) {
  try {
    console.log("[v0] Quote form submission received:", { name: data.name, insuranceType: data.insuranceType })

    // Send notification to admin
    const adminEmail = await resend.emails.send({
      from: FROM_EMAIL,
      to: RECIPIENT_EMAILS,
      subject: `New Quote Request - ${data.insuranceType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1a3a5c;">New Quote Request</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>Insurance Type:</strong> ${data.insuranceType}</p>
          <p><strong>Additional Information:</strong></p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${data.message || "No additional details provided"}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">This email was sent from www.goldeneagleltd.com quote form</p>
        </div>
      `,
    })

    console.log("[v0] Admin quote notification sent:", adminEmail)

    // Send confirmation to user
    const userEmail = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: "Quote Request Received - Golden Eagle Insurance",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1a3a5c;">Your Quote Request is Being Processed</h2>
          <p>Hi ${data.name},</p>
          <p>Thank you for requesting a quote from Golden Eagle Insurance! We've received your request for ${data.insuranceType} insurance and our team is now preparing a personalized quote for you.</p>
          <p>We'll be in touch shortly with your quotation and any additional information you may need.</p>
          <p><strong>Expected timeframe:</strong> 24-48 business hours</p>
          <p>If you need immediate assistance, please contact us directly:</p>
          <p>
            +254 722 518 485<br />
            +254 733 606 661<br />
            +254 20 2606 661
          </p>
          <hr />
          <p style="color: #666; font-size: 12px;">Golden Eagle Insurance - Your Partner in Protection</p>
        </div>
      `,
    })

    console.log("[v0] User quote confirmation sent:", userEmail)

    return { success: true }
  } catch (error) {
    console.error("[v0] Quote form email error - Full details:", error)
    return { success: false, error: "Failed to send email" }
  }
}

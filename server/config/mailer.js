import nodemailer from 'nodemailer'
import { env } from './env.js'

export const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT) || 587,
      secure: false,       // false = STARTTLS on port 587 (Gmail requires this)
      requireTLS: true,    // force upgrade to TLS
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    })
  : null

export async function sendMail({ to, subject, html }) {
  if (!transporter) {
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log(`\n[mailer] (dev mode, no SMTP configured)\n  To: ${to}\n  Subject: ${subject}\n  Body: ${plain}\n`)
    return { mocked: true }
  }
  return transporter.sendMail({ from: `SVBBS <${env.SMTP_USER}>`, to, subject, html })
}
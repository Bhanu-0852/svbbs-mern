import QRCode from 'qrcode'
import { env } from '../config/env.js'

/**
 * Encodes a URL to this book's detail page, tagged with ?via=qr so the
 * frontend can log a "scanned" event into the Book History Ledger when
 * someone actually arrives through a real scan (see books.js POST /:id/scan).
 *
 * Uses CLIENT_URL, which defaults to http://localhost:3000 — fine for
 * browser testing, but a phone's camera can't resolve "localhost" back
 * to your laptop. For an actual scan-with-your-phone demo, set CLIENT_URL
 * to your machine's LAN IP (e.g. http://192.168.1.5:3000) and run the
 * client with `npm run dev -- --host`, or to your deployed URL once
 * you've deployed — documented in the README.
 */
export async function generateBookQrPng(bookId) {
  const url = `${env.CLIENT_URL}/marketplace/${bookId}?via=qr`
  return QRCode.toBuffer(url, {
    type: 'png',
    width: 320,
    margin: 2,
    color: { dark: '#0A0F1E', light: '#FFFFFF' },
  })
}

export function getBookQrUrl(bookId) {
  return `${env.CLIENT_URL}/marketplace/${bookId}?via=qr`
}

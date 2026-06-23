import PDFDocument from 'pdfkit'
import { format } from 'date-fns'

const NAVY = '#0A0F1E'
const GOLD = '#F0A500'
const SLATE = '#475569'
const LIGHT = '#94A3B8'

const CATEGORY_LABELS = {
  engineering: 'Engineering',
  medical: 'Medical',
  government_exam: 'Government Exam',
  rare: 'Rare',
  arts: 'Arts',
  science: 'Science',
  general: 'General',
}

/**
 * Builds a designed PDF document for the Academic Passport. Returns the
 * PDFDocument instance — the caller pipes it to the HTTP response.
 * Book covers aren't embedded (would require fetching each remote image
 * server-side first); the reading history renders as a clean text table
 * instead, which keeps generation fast and dependency-free.
 */
export function generatePassportPdf(passport) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 0, bottom: 50, left: 50, right: 50 } })

  // Header band
  doc.rect(0, 0, doc.page.width, 130).fill(NAVY)
  doc
    .fillColor(GOLD)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('KNOWLEDGE CREDIT ECONOMY', 50, 40, { characterSpacing: 1 })
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(26).text('Academic Passport', 50, 58)
  doc.fillColor(LIGHT).font('Helvetica').fontSize(10).text('Smart Vendor Book Bank System', 50, 92)

  let y = 160

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(16).text(passport.user.name, 50, y)
  y += 22
  doc.fillColor(SLATE).font('Helvetica').fontSize(10).text(passport.user.email, 50, y)
  y += 14
  doc.fillColor(LIGHT).fontSize(9).text(`Member since ${format(new Date(passport.user.memberSince), 'MMMM yyyy')}`, 50, y)
  y += 30

  // Gold divider
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(GOLD).lineWidth(1.5).stroke()
  y += 25

  // Stats row
  const stats = [
    { label: 'Books Borrowed', value: String(passport.stats.totalBooksBorrowed) },
    { label: 'KC Spent', value: `${passport.stats.totalKcSpent}` },
    { label: 'Cash Spent', value: `₹${passport.stats.totalCashSpent}` },
    { label: 'Categories Explored', value: String(passport.stats.categoriesExplored.length) },
  ]
  const colWidth = (doc.page.width - 100) / stats.length
  stats.forEach((s, i) => {
    const x = 50 + i * colWidth
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(20).text(s.value, x, y, { width: colWidth - 10 })
    doc.fillColor(LIGHT).font('Helvetica').fontSize(8).text(s.label.toUpperCase(), x, y + 26, {
      width: colWidth - 10,
      characterSpacing: 0.5,
    })
  })
  y += 60

  if (passport.stats.categoriesExplored.length > 0) {
    const labels = passport.stats.categoriesExplored.map((c) => CATEGORY_LABELS[c] || c).join('  ·  ')
    doc.fillColor(SLATE).font('Helvetica').fontSize(9).text(labels, 50, y, { width: doc.page.width - 100 })
    y += 30
  }

  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#E2E8F0').lineWidth(1).stroke()
  y += 20

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text('Reading History', 50, y)
  y += 22

  if (passport.books.length === 0) {
    doc.fillColor(LIGHT).font('Helvetica').fontSize(10).text('No books borrowed yet.', 50, y)
  } else {
    passport.books.forEach((b) => {
      if (y > doc.page.height - 100) {
        doc.addPage()
        y = 50
      }
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10.5).text(b.title, 50, y, { width: 320 })
      doc.fillColor(LIGHT).font('Helvetica').fontSize(9).text(format(new Date(b.borrowedAt), 'MMM d, yyyy'), 380, y, {
        width: 90,
        align: 'right',
      })
      doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9).text(`${b.kcCost} KC`, 470, y, { width: 75, align: 'right' })
      y += 14
      doc.fillColor(SLATE).font('Helvetica').fontSize(9).text(b.author, 50, y, { width: 320 })
      y += 22
    })
  }

  // Footer
  doc
    .fillColor(LIGHT)
    .font('Helvetica')
    .fontSize(8)
    .text(
      `Generated ${format(new Date(), "MMM d, yyyy 'at' h:mm a")} · Verified by SVBBS`,
      50,
      doc.page.height - 40,
      { width: doc.page.width - 100, align: 'center' }
    )

  return doc
}

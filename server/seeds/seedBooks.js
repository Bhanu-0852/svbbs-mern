import Book from '../models/Book.js'
import BookHistory from '../models/BookHistory.js'
import RfidTag from '../models/RfidTag.js'
import ExchangeProposal from '../models/ExchangeProposal.js'
import Transaction from '../models/Transaction.js'
import { calculateKcValue } from '../utils/kcRules.js'
import { coverUrl } from '../utils/bookCovers.js'
import { calculateDueDate } from '../utils/loanPolicy.js'

// Real, widely-catalogued ISBNs so Open Library covers reliably resolve.
// conditionPhotos reuse the same cover at a smaller size as a stand-in for
// a second angle — real condition photos arrive once the vendor upload
// pipeline (multer + Cloudinary) hasn't been built yet.
const RAW_BOOKS = [
  // Engineering / CS
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', categoryTags: ['engineering'], condition: 'good' },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', categoryTags: ['engineering'], condition: 'excellent' },
  { title: 'The Pragmatic Programmer', author: 'David Thomas', isbn: '9780201616224', categoryTags: ['engineering'], condition: 'average', examTags: ['GATE'] },
  { title: 'Design Patterns', author: 'Erich Gamma', isbn: '9780201633610', categoryTags: ['engineering'], condition: 'good', examTags: ['GATE'] },
  { title: 'Computer Networking: A Top-Down Approach', author: 'James F. Kurose', isbn: '9780133594140', categoryTags: ['engineering'], condition: 'poor', examTags: ['GATE'] },

  // Medical
  { title: "Gray's Anatomy for Students", author: 'Richard Drake', isbn: '9780702077050', categoryTags: ['medical'], condition: 'excellent' },
  { title: 'Robbins Basic Pathology', author: 'Vinay Kumar', isbn: '9780323353175', categoryTags: ['medical'], condition: 'good' },
  { title: "Harrison's Principles of Internal Medicine", author: 'J. Larry Jameson', isbn: '9781259644030', categoryTags: ['medical', 'rare'], condition: 'average' },

  // Government Exam
  { title: "India's Struggle for Independence", author: 'Bipan Chandra', isbn: '9780140107816', categoryTags: ['government_exam'], condition: 'good', examTags: ['UPSC', 'APPSC', 'TSPSC'] },
  { title: 'Indian Polity', author: 'M. Laxmikanth', isbn: '9789339204785', categoryTags: ['government_exam'], condition: 'excellent', examTags: ['UPSC', 'SSC', 'APPSC', 'TSPSC'] },
  { title: 'Wren and Martin English Grammar', author: 'P. C. Wren', isbn: '9788121903030', categoryTags: ['government_exam'], condition: 'average', examTags: ['SSC', 'Banking'] },
  { title: 'Quantitative Aptitude for Competitive Examinations', author: 'R. S. Aggarwal', isbn: '9789352534029', categoryTags: ['government_exam'], condition: 'good', examTags: ['Railways', 'SSC', 'Banking'] },
  { title: 'Pathfinder NDA & NA Entrance Examination', author: 'Arihant Experts', isbn: '9789313167846', categoryTags: ['government_exam'], condition: 'excellent', examTags: ['Defence'] },
  { title: 'How to Prepare for Quantitative Aptitude for CAT', author: 'Arun Sharma', isbn: '9780070619937', categoryTags: ['government_exam'], condition: 'good', examTags: ['CAT'] },

  // Arts
  { title: 'The Story of Art', author: 'E. H. Gombrich', isbn: '9780714832470', categoryTags: ['arts'], condition: 'good' },
  { title: 'Ways of Seeing', author: 'John Berger', isbn: '9780140135152', categoryTags: ['arts'], condition: 'excellent' },

  // Science
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', categoryTags: ['science'], condition: 'good' },
  { title: 'Cosmos', author: 'Carl Sagan', isbn: '9780345539434', categoryTags: ['science'], condition: 'excellent' },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '9780198788607', categoryTags: ['science', 'rare'], condition: 'average' },

  // General
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', categoryTags: ['general'], condition: 'excellent' },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', categoryTags: ['general'], condition: 'good' },
  { title: 'The Lean Startup', author: 'Eric Ries', isbn: '9780307887894', categoryTags: ['general'], condition: 'poor' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', categoryTags: ['general', 'rare'], condition: 'good' },
]

// A handful are shown as on_loan / reserved so the Marketplace demonstrates
// every status badge, not just "available".
const STATUS_OVERRIDES = {
  'Clean Code': 'on_loan',
  'Gray\'s Anatomy for Students': 'reserved',
  'Computer Networking: A Top-Down Approach': 'recycled',
}

export async function seedBooks({ vendorUserId, studentUserId }) {
  await Book.deleteMany({})
  await BookHistory.deleteMany({})
  await RfidTag.deleteMany({})
  await Transaction.deleteMany({})
  await ExchangeProposal.deleteMany({})

  const docs = RAW_BOOKS.map((b) => {
    const status = STATUS_OVERRIDES[b.title] || 'available'
    // "Clean Code" is seeded as on_loan — give it a real holder and a
    // real due date, not just a status badge with nobody actually
    // holding it (which would be unreturnable by design). Borrowed 13
    // days ago against the 14-day loan period lands it 1 day from now —
    // solidly inside the due-soon window, so logging in as the demo
    // student immediately shows a real, live due-date reminder.
    const isSeededLoan = status === 'on_loan'
    return {
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      categoryTags: b.categoryTags,
      examTags: b.examTags || [],
      condition: b.condition,
      coverImage: coverUrl(b.isbn, 'L'),
      conditionPhotos: [coverUrl(b.isbn, 'L'), coverUrl(b.isbn, 'M')],
      kcValue: calculateKcValue(b.condition, b.categoryTags),
      status,
      ownerId: vendorUserId,
      currentHolderId: isSeededLoan ? studentUserId : null,
      dueDate: isSeededLoan ? calculateDueDate(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)) : null,
      description: `A well-known title in ${b.categoryTags.join(', ')}. Seeded for demo purposes.`,
    }
  })

  const inserted = await Book.insertMany(docs)

  // Seed a short, believable history ledger for each book
  const historyDocs = inserted.map((book) => ({
    bookId: book._id,
    event: 'deposited',
    fromUserId: vendorUserId,
    condition: book.condition,
    kcAmount: book.kcValue,
    note: 'Initial deposit into the vendor inventory.',
  }))

  // The one seeded "recycled" book gets a second history entry so its
  // ledger tells a complete, believable story.
  const recycledBook = inserted.find((b) => b.status === 'recycled')
  if (recycledBook) {
    historyDocs.push({
      bookId: recycledBook._id,
      event: 'recycled',
      fromUserId: vendorUserId,
      condition: recycledBook.condition,
      note: 'Condition too poor for resale — sent to the recycling partner.',
    })
  }

  // Same idea for the one seeded "on_loan" book — a real borrow event,
  // not just a status flag with no story behind it.
  const onLoanBook = inserted.find((b) => b.status === 'on_loan')
  if (onLoanBook) {
    historyDocs.push({
      bookId: onLoanBook._id,
      event: 'borrowed',
      fromUserId: vendorUserId,
      toUserId: studentUserId,
      condition: onLoanBook.condition,
      kcAmount: onLoanBook.kcValue,
      note: `Paid ${onLoanBook.kcValue} KC. Due back within 14 days.`,
    })
  }

  await BookHistory.insertMany(historyDocs)

  console.log(`[seed] Inserted ${inserted.length} books with real covers and a history ledger.`)
  return inserted
}

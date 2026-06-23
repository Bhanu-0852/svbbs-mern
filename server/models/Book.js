import mongoose from 'mongoose'

const { Schema } = mongoose

const CONDITIONS = ['excellent', 'good', 'average', 'poor']
const STATUSES = ['available', 'on_loan', 'reserved', 'recycled', 'sold']
const CATEGORY_TAGS = ['engineering', 'medical', 'government_exam', 'rare', 'arts', 'science', 'general']

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, trim: true, index: true },
    edition: { type: String, default: null },
    description: { type: String, default: '' },

    categoryTags: { type: [String], enum: CATEGORY_TAGS, default: ['general'] },
    examTags: { type: [String], default: [] }, // e.g. ['UPSC', 'GATE'] — links into the Exam Hub

    // Image plan §3.1: a real cover for the shelf, plus real condition
    // photos (front/back/spine/wear) shown on the detail page.
    coverImage: { type: String, required: true },
    conditionPhotos: { type: [String], default: [] },

    condition: { type: String, enum: CONDITIONS, required: true },
    aiScore: { type: Number, min: 0, max: 100, default: null },
    aiConditionReport: { type: String, default: null },

    kcValue: { type: Number, required: true },

    status: { type: String, enum: STATUSES, default: 'available', index: true },

    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currentHolderId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // set once borrowed
    // Set when borrowed (now + LOAN_PERIOD_DAYS, see borrowService.js),
    // cleared back to null on return. Borrowing was previously fully
    // open-ended with no deadline at all — this is what
    // notificationService.checkDueReminders reads to honestly know
    // whether a held book is due soon or overdue.
    dueDate: { type: Date, default: null },
    // Set only while status === 'reserved': the one student allowed to
    // claim this book next, because they were first on the waitlist when
    // it was returned. Anyone else's borrow attempt is blocked while this
    // is set. See waitlistService.js.
    reservedForUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // The actual real behavior per method, wired in depositService.js:
    //  - deposit: depositor is credited the book's full KC value immediately
    //  - donate: kcValue is forced to 0, so the existing borrow flow already
    //    treats it as a free borrow — no special-cased borrow logic needed
    //  - sell: cash-only outright purchase via salePrice, no KC involved,
    //    not borrowable (see books.js listing filter)
    //  - exchange: listed for a direct 1:1 swap proposal with another
    //    student's book; see ExchangeProposal.js
    depositMethod: {
      type: String,
      enum: ['deposit', 'donate', 'exchange', 'sell'],
      default: 'deposit',
    },
    salePrice: { type: Number, default: null }, // only set when depositMethod === 'sell'
  },
  { timestamps: true }
)

// Supports the Marketplace search bar (title/author) and category/status filters
bookSchema.index({ title: 'text', author: 'text' })
bookSchema.index({ categoryTags: 1, status: 1 })
bookSchema.index({ examTags: 1, status: 1 })

export const BOOK_CONDITIONS = CONDITIONS
export const BOOK_STATUSES = STATUSES
export const BOOK_CATEGORY_TAGS = CATEGORY_TAGS

export default mongoose.model('Book', bookSchema)

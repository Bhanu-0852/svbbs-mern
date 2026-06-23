import crypto from 'crypto'
import Book from '../models/Book.js'
import RfidTag from '../models/RfidTag.js'
import BookHistory from '../models/BookHistory.js'
import { fail } from '../utils/response.js'
import { logAudit } from './auditService.js'
import { nextRfidStatus } from '../utils/rfidStatus.js'

/**
 * Generates a realistic-looking RFID UID, in the hex-block format real
 * EPC Gen2 tags use (e.g. "E280-1160-6000-0211-0123-4567"). This is what
 * a physical reader would hand back after a tap — there is no hardware
 * here to read from, so registration mints one the same way a vendor
 * pulling a fresh tag out of a box would see a UID already printed on it.
 */
function generateTagId() {
  const bytes = crypto.randomBytes(12).toString('hex').toUpperCase()
  return bytes.match(/.{1,4}/g).join('-')
}

export async function registerTag(bookId, vendorId, req) {
  const book = await Book.findOne({ _id: bookId, ownerId: vendorId })
  if (!book) {
    throw fail(404, 'Book not found in your inventory.')
  }

  const existing = await RfidTag.findOne({ bookId })
  if (existing) {
    throw fail(409, 'This book already has an RFID tag registered.')
  }

  let tagId
  // Astronomically unlikely to collide, but guard it properly rather than
  // assume — this is a real unique index, not a cosmetic one.
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateTagId()
    // eslint-disable-next-line no-await-in-loop
    const taken = await RfidTag.findOne({ tagId: candidate })
    if (!taken) {
      tagId = candidate
      break
    }
  }
  if (!tagId) {
    throw fail(500, 'Could not generate a unique tag ID. Please try again.')
  }

  const tag = await RfidTag.create({
    tagId,
    bookId,
    vendorId,
    status: 'checked_in', // a freshly tagged book is assumed to be on the shelf
  })

  await BookHistory.create({
    bookId,
    event: 'rfid_registered',
    fromUserId: vendorId,
    note: `RFID tag ${tagId} registered.`,
  })

  await logAudit({ actorId: vendorId, action: 'rfid.register', target: bookId, req, metadata: { tagId } })

  return { tag }
}

export async function getTags(vendorId) {
  return RfidTag.find({ vendorId }).populate('bookId', 'title author coverImage status').sort({ createdAt: -1 })
}

/**
 * Simulates a physical scan: looks up which book a tag belongs to and
 * flips its custody status, the opposite of whatever it currently is.
 * Atomic guard on the status flip — if two people "scan" the same tag at
 * the same instant, only one transition wins, not a corrupted double-flip.
 */
export async function scanTag(tagId, vendorId, req) {
  const existingTag = await RfidTag.findOne({ tagId: tagId.toUpperCase().trim() })
  if (!existingTag) {
    throw fail(404, 'No book is registered to this tag.')
  }
  if (String(existingTag.vendorId) !== String(vendorId)) {
    throw fail(403, 'This tag belongs to a different vendor.')
  }

  const nextStatus = nextRfidStatus(existingTag.status)

  const tag = await RfidTag.findOneAndUpdate(
    { _id: existingTag._id, status: existingTag.status },
    { status: nextStatus, lastScannedAt: new Date(), lastScannedBy: vendorId },
    { new: true }
  ).populate('bookId', 'title author coverImage status')

  if (!tag) {
    throw fail(409, 'This tag was just scanned by someone else. Please try again.')
  }

  await BookHistory.create({
    bookId: tag.bookId._id,
    event: nextStatus === 'checked_out' ? 'rfid_checked_out' : 'rfid_checked_in',
    fromUserId: vendorId,
    note: `RFID tag ${tag.tagId} scanned — book ${nextStatus === 'checked_out' ? 'left' : 'returned to'} the shelf.`,
  })

  await logAudit({
    actorId: vendorId,
    action: nextStatus === 'checked_out' ? 'rfid.check_out' : 'rfid.check_in',
    target: tag.bookId._id,
    req,
    metadata: { tagId: tag.tagId },
  })

  return { tag }
}

export async function getScanHistory(bookId, vendorId) {
  const tag = await RfidTag.findOne({ bookId, vendorId })
  if (!tag) {
    throw fail(404, 'No RFID tag registered for this book.')
  }
  const history = await BookHistory.find({
    bookId,
    event: { $in: ['rfid_registered', 'rfid_checked_out', 'rfid_checked_in'] },
  })
    .sort({ createdAt: -1 })
    .populate('fromUserId', 'name')

  return { tag, history }
}

export async function getStats(vendorId) {
  const [totalTagged, checkedOut, checkedIn] = await Promise.all([
    RfidTag.countDocuments({ vendorId }),
    RfidTag.countDocuments({ vendorId, status: 'checked_out' }),
    RfidTag.countDocuments({ vendorId, status: 'checked_in' }),
  ])
  return { totalTagged, checkedOut, checkedIn }
}

import * as csrService from '../services/csrService.js'
import { ok } from '../utils/response.js'

export async function getSummary(req, res, next) {
  try {
    const summary = await csrService.getSponsorSummary(req.user._id)
    ok(res, summary)
  } catch (err) {
    next(err)
  }
}

export async function getStudents(req, res, next) {
  try {
    const students = await csrService.listStudents()
    ok(res, { students })
  } catch (err) {
    next(err)
  }
}

export async function grant(req, res, next) {
  try {
    const { studentId, kcAmount, note } = req.body
    const result = await csrService.grantToStudent(
      { sponsorId: req.user._id, studentId, kcAmount, note },
      req
    )
    ok(res, result, 'Grant applied to the student’s wallet.')
  } catch (err) {
    next(err)
  }
}

export async function getSponsorableBooks(req, res, next) {
  try {
    const books = await csrService.listSponsorableBooks()
    ok(res, { books })
  } catch (err) {
    next(err)
  }
}

export async function sponsorBook(req, res, next) {
  try {
    const { studentId, bookId, note } = req.body
    const result = await csrService.sponsorBook(
      { sponsorId: req.user._id, studentId, bookId, note },
      req
    )
    ok(res, result, 'Book sponsored — fully covered for the student.')
  } catch (err) {
    next(err)
  }
}

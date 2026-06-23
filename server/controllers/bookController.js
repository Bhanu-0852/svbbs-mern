import * as bookService from '../services/bookService.js'
import { getRecommendations } from '../services/recommendationService.js'
import { generateBookQrPng } from '../services/qrService.js'
import { ok } from '../utils/response.js'

export async function listBooks(req, res, next) {
  try {
    const { items, pagination } = await bookService.listBooks(req.query)
    ok(res, { books: items, pagination })
  } catch (err) {
    next(err)
  }
}

export async function getBookRecommendations(req, res, next) {
  try {
    const { basis, recommendations } = await getRecommendations(req.user._id)
    ok(res, { basis, recommendations })
  } catch (err) {
    next(err)
  }
}

export async function getBook(req, res, next) {
  try {
    const { book, history } = await bookService.getBookById(req.params.id)
    ok(res, { book, history })
  } catch (err) {
    next(err)
  }
}

export async function getQrCode(req, res, next) {
  try {
    const png = await generateBookQrPng(req.params.id)
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(png)
  } catch (err) {
    next(err)
  }
}

export async function logScan(req, res, next) {
  try {
    await bookService.logScan(req.params.id, req.user?._id)
    ok(res, {}, 'Scan logged.')
  } catch (err) {
    next(err)
  }
}

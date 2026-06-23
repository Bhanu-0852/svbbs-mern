import * as rfidService from '../services/rfidService.js'
import { ok, created } from '../utils/response.js'

export async function registerTag(req, res, next) {
  try {
    const result = await rfidService.registerTag(req.body.bookId, req.user._id, req)
    created(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getTags(req, res, next) {
  try {
    const tags = await rfidService.getTags(req.user._id)
    ok(res, { tags })
  } catch (err) {
    next(err)
  }
}

export async function scanTag(req, res, next) {
  try {
    const result = await rfidService.scanTag(req.body.tagId, req.user._id, req)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getScanHistory(req, res, next) {
  try {
    const result = await rfidService.getScanHistory(req.params.bookId, req.user._id)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getStats(req, res, next) {
  try {
    const stats = await rfidService.getStats(req.user._id)
    ok(res, { stats })
  } catch (err) {
    next(err)
  }
}

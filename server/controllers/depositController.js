import * as depositService from '../services/depositService.js'
import { ok, created } from '../utils/response.js'

export async function depositBook(req, res, next) {
  try {
    const result = await depositService.depositBook(req.user._id, req.body, req)
    created(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getMyListings(req, res, next) {
  try {
    const books = await depositService.listMyListings(req.user._id)
    ok(res, { books })
  } catch (err) {
    next(err)
  }
}

export async function buyBook(req, res, next) {
  try {
    const result = await depositService.buyBook(req.params.id, req.user._id, req)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function proposeExchange(req, res, next) {
  try {
    const result = await depositService.proposeExchange(req.params.id, req.body.offeredBookId, req.user._id, req)
    created(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getMyExchangeProposals(req, res, next) {
  try {
    const result = await depositService.getMyExchangeProposals(req.user._id)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function respondToExchange(req, res, next) {
  try {
    const result = await depositService.respondToExchange(req.params.id, req.user._id, req.body.accept, req)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

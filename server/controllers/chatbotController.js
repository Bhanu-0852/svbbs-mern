import * as chatbotService from '../services/chatbotService.js'
import { ok } from '../utils/response.js'

export async function getHistory(req, res, next) {
  try {
    const messages = await chatbotService.getHistory(req.user._id)
    ok(res, { messages })
  } catch (err) {
    next(err)
  }
}

export async function sendMessage(req, res, next) {
  try {
    const result = await chatbotService.sendMessage(req.user._id, req.body.message)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function explainFeature(req, res, next) {
  try {
    const feature = (req.body.feature || '').trim()
    const result = await chatbotService.explainFeature(feature, req.user._id)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}
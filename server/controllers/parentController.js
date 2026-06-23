import * as parentService from '../services/parentService.js'
import { ok } from '../utils/response.js'

export async function getChildren(req, res, next) {
  try {
    const children = await parentService.getLinkedChildren(req.user._id)
    ok(res, { children })
  } catch (err) {
    next(err)
  }
}

export async function topUp(req, res, next) {
  try {
    const { studentId, kcAmount } = req.body
    const result = await parentService.topUpChild({ parentId: req.user._id, studentId, kcAmount }, req)
    ok(res, result, 'Top-up applied.')
  } catch (err) {
    next(err)
  }
}

export async function getActivity(req, res, next) {
  try {
    const activity = await parentService.getChildActivity(req.user._id, req.params.studentId)
    ok(res, { activity })
  } catch (err) {
    next(err)
  }
}

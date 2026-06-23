import * as sustainabilityService from '../services/sustainabilityService.js'
import { ok } from '../utils/response.js'

export async function getImpact(req, res, next) {
  try {
    const [stats, categoryBreakdown] = await Promise.all([
      sustainabilityService.getImpactStats(),
      sustainabilityService.getCategoryBreakdown(),
    ])
    ok(res, { stats, categoryBreakdown })
  } catch (err) {
    next(err)
  }
}

export async function getMyImpact(req, res, next) {
  try {
    const stats = await sustainabilityService.getPersonalImpact(req.user._id)
    ok(res, { stats })
  } catch (err) {
    next(err)
  }
}

import * as superAdminService from '../services/superAdminService.js'
import * as fraudService from '../services/fraudService.js'
import { ok } from '../utils/response.js'

export async function getStats(req, res, next) {
  try {
    const stats = await superAdminService.getStats()
    ok(res, { stats })
  } catch (err) {
    next(err)
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const logs = await superAdminService.getRecentAuditLogs(20)
    ok(res, { logs })
  } catch (err) {
    next(err)
  }
}

export async function getFraudSignals(req, res, next) {
  try {
    const signals = await fraudService.getFraudSignals()
    ok(res, signals)
  } catch (err) {
    next(err)
  }
}

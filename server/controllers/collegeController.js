import * as collegeService from '../services/collegeService.js'
import { ok, created } from '../utils/response.js'

export async function getOverview(req, res, next) {
  try {
    const overview = await collegeService.getOverview(req.user.collegeId)
    ok(res, overview)
  } catch (err) {
    next(err)
  }
}

export async function getStudents(req, res, next) {
  try {
    const students = await collegeService.getStudents(req.user.collegeId)
    ok(res, { students })
  } catch (err) {
    next(err)
  }
}

export async function awardScholarship(req, res, next) {
  try {
    const result = await collegeService.awardScholarship(
      {
        collegeAdminId: req.user._id,
        collegeId: req.user.collegeId,
        studentId: req.body.studentId,
        kcAmount: req.body.kcAmount,
        note: req.body.note,
      },
      req
    )
    created(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getScholarshipHistory(req, res, next) {
  try {
    const history = await collegeService.getScholarshipHistory(req.user.collegeId)
    ok(res, history)
  } catch (err) {
    next(err)
  }
}

export async function getDemandForecast(req, res, next) {
  try {
    const forecast = await collegeService.getDemandForecast(req.user.collegeId)
    ok(res, forecast)
  } catch (err) {
    next(err)
  }
}

import * as mentorService from '../services/careerMentorService.js'
import { ok } from '../utils/response.js'

export async function getRoadmap(req, res, next) {
  try {
    const roadmap = await mentorService.generateCareerRoadmap(req.user._id)
    ok(res, roadmap)
  } catch (err) {
    next(err)
  }
}
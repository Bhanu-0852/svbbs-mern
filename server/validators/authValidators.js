import Joi from 'joi'
import { ROLE_VALUES } from '../models/User.js'

const SELF_REGISTER_ROLES = ['student', 'parent']

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(10).max(128).required(),
  role: Joi.string().valid(...SELF_REGISTER_ROLES).default('student'),
  captchaToken: Joi.string().allow('').optional(),
})

export const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
  mfaCode: Joi.string().length(6).pattern(/^\d+$/).optional(),
  backupCode: Joi.string().optional(),
  captchaToken: Joi.string().allow('').optional(),
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
})

// Both token (old link-based) and otp (new 6-digit code) accepted —
// the frontend sends whichever the current flow uses.
export const resetPasswordSchema = Joi.object({
  token: Joi.string().optional(),
  otp: Joi.string().length(6).pattern(/^\d+$/).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).optional(),
  password: Joi.string().min(10).max(128).required(),
}).or('token', 'otp')

export const verifyEmailSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
})

// Email OTP login — user requests an OTP to be sent to their email
export const requestEmailOtpSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
})

// Verify email OTP login — user submits the code they received
export const verifyEmailOtpLoginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
})

export const mfaVerifySchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
})

export { ROLE_VALUES }

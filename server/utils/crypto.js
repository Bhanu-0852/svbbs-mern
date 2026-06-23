import crypto from 'crypto'
import { env } from '../config/env.js'

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  // Must be exactly 32 bytes for AES-256
  return Buffer.from(env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
}

export function encrypt(plainText) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // store iv + authTag + ciphertext together, base64-joined
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.')
}

export function decrypt(payload) {
  const [ivB64, authTagB64, dataB64] = payload.split('.')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return decrypted.toString('utf8')
}

/** SHA-256 hash of a raw token — used for storing reset/verification/refresh
 * tokens so the DB never holds the usable value (spec §9.4, §9.5). */
export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export function generateRawToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

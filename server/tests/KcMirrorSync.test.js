import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { BASE_KC, CATEGORY_BONUS } from '../utils/kcRules.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * The DepositPriceHelper component shows the student a live KC estimate
 * computed CLIENT-SIDE, mirroring server/utils/kcRules.js. If the server
 * rules change but the client copy doesn't, students would see a wrong
 * estimate then get credited a different amount — a trust-breaking bug.
 *
 * This test parses the client component's hardcoded values and asserts
 * they exactly match the server's source of truth, so the two can never
 * silently drift apart.
 */
describe('DepositPriceHelper client/server KC sync', () => {
  const clientPath = resolve(__dirname, '../../client/src/components/ai/DepositPriceHelper.jsx')
  const clientSource = readFileSync(clientPath, 'utf-8')

  it('client BASE_KC matches server BASE_KC exactly', () => {
    const match = clientSource.match(/const BASE_KC = \{([^}]+)\}/)
    expect(match).toBeTruthy()
    const clientBase = {}
    match[1].split(',').forEach((pair) => {
      const [k, v] = pair.split(':').map((s) => s.trim())
      if (k) clientBase[k] = Number(v)
    })
    expect(clientBase).toEqual(BASE_KC)
  })

  it('client CATEGORY_BONUS matches server CATEGORY_BONUS exactly', () => {
    const match = clientSource.match(/const CATEGORY_BONUS = \{([^}]+)\}/)
    expect(match).toBeTruthy()
    const clientBonus = {}
    match[1].split(',').forEach((pair) => {
      const [k, v] = pair.split(':').map((s) => s.trim())
      if (k) clientBonus[k] = Number(v)
    })
    expect(clientBonus).toEqual(CATEGORY_BONUS)
  })
})
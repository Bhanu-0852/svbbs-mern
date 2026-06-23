import { buildPassport } from '../services/passportService.js'
import { generatePassportPdf } from '../services/pdfService.js'
import { ok } from '../utils/response.js'

export async function getPassport(req, res, next) {
  try {
    const passport = await buildPassport(req.user._id)
    ok(res, { passport })
  } catch (err) {
    next(err)
  }
}

export async function downloadPassportPdf(req, res, next) {
  try {
    const passport = await buildPassport(req.user._id)
    const doc = generatePassportPdf(passport)

    const filename = `SVBBS-Academic-Passport-${passport.user.name.replace(/\s+/g, '-')}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    doc.pipe(res)
    doc.end()
  } catch (err) {
    next(err)
  }
}

import User from '../models/User.js'
import College from '../models/College.js'
import KCWallet from '../models/KCWallet.js'
import Sponsorship from '../models/Sponsorship.js'
import Scholarship from '../models/Scholarship.js'
import { hashPassword } from '../utils/hash.js'

const DEMO_PASSWORD = 'Demo!Pass123'

const DEMO_COLLEGE = { name: 'Nehru Institute of Technology', city: 'Coimbatore', code: 'NIT-CBE' }

// `college: true` means this user gets assigned to the demo college via
// collegeId, so the College Admin dashboard has real students + real
// borrowing activity to scope to (rather than an empty institution).
//
// The parent ('Rajesh Verma') is listed BEFORE the student so its _id
// already exists by the time the student's row is processed below,
// letting the student get parentId set inline the same way collegeId is.
const DEMO_USERS = [
  { name: 'Vendor Books Co.', email: 'vendor@svbbs.demo', role: 'vendor', startingKc: 0 },
  { name: 'Admin User', email: 'admin@svbbs.demo', role: 'super_admin', startingKc: 0 },
  { name: 'GreenCycle Partner', email: 'recycler@svbbs.demo', role: 'recycler', startingKc: 0 },
  { name: 'College Office', email: 'college@svbbs.demo', role: 'college_admin', startingKc: 0, college: true },
  { name: 'TechCorp CSR', email: 'csr@svbbs.demo', role: 'csr_sponsor', startingKc: 0 },
  { name: 'Rajesh Verma', email: 'parent@svbbs.demo', role: 'parent', startingKc: 0 },
  {
    name: 'Asha Verma',
    email: 'student@svbbs.demo',
    role: 'student',
    startingKc: 500,
    college: true,
    linkParent: true,
  },
]

export async function seedUsers() {
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  // Wallet balances below get unconditionally reset to their seed
  // starting values on every run. Sponsorship/Scholarship records are the
  // audit trail of KC granted into those wallets — left unwiped, they'd
  // claim funding history that no longer matches the reset balance.
  // (User/College _ids stay stable across reseeds via upsert below, so —
  // unlike Book — these aren't a dangling-reference risk, just a stale
  // audit-trail one; still worth clearing for a consistent "fresh start".)
  await Sponsorship.deleteMany({})
  await Scholarship.deleteMany({})

  const college = await College.findOneAndUpdate(
    { code: DEMO_COLLEGE.code },
    DEMO_COLLEGE,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  const created = {}

  for (const u of DEMO_USERS) {
    const user = await User.findOneAndUpdate(
      { email: u.email },
      {
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash,
        isVerified: true,
        isActive: true,
        collegeId: u.college ? college._id : null,
        collegeVerified: u.college ? true : false,
        parentId: u.linkParent ? created.parent?._id || null : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    created[u.role] = user

    await KCWallet.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, balance: u.startingKc },
      { upsert: true, setDefaultsOnInsert: true }
    )
  }

  console.log(`[seed] Demo college: ${college.name} (${college.code})`)
  console.log(`[seed] Demo users ready. Password for all demo accounts: ${DEMO_PASSWORD}`)
  console.log(`[seed]   vendor@svbbs.demo (vendor) / ${DEMO_PASSWORD}`)
  console.log(`[seed]   student@svbbs.demo (student, 500 KC, ${college.code}) / ${DEMO_PASSWORD}`)
  console.log(`[seed]   admin@svbbs.demo (super_admin) / ${DEMO_PASSWORD}`)
  console.log(`[seed]   recycler@svbbs.demo (recycler) / ${DEMO_PASSWORD}`)
  console.log(`[seed]   college@svbbs.demo (college_admin, ${college.code}) / ${DEMO_PASSWORD}`)
  console.log(`[seed]   csr@svbbs.demo (csr_sponsor) / ${DEMO_PASSWORD}`)
  console.log(`[seed]   parent@svbbs.demo (parent, linked to Asha Verma) / ${DEMO_PASSWORD}`)

  created.college = college
  return created
}

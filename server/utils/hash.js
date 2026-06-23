import bcrypt from 'bcryptjs'

const ROUNDS = 12

export async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

// A real bcrypt hash of a random value. Used when no user is found during
// login so we still run a bcrypt.compare() of similar cost — this prevents
// "user exists" from being inferable purely from response time (spec §9.2).
const DUMMY_HASH = bcrypt.hashSync('svbbs-dummy-password-for-timing-safety', ROUNDS)

export async function compareAgainstDummy() {
  return bcrypt.compare('irrelevant', DUMMY_HASH)
}

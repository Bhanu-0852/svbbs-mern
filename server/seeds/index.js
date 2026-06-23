import { connectDB } from '../config/db.js'
import mongoose from 'mongoose'
import { seedUsers } from './seedUsers.js'
import { seedBooks } from './seedBooks.js'

async function run() {
  await connectDB()

  const users = await seedUsers()
  await seedBooks({ vendorUserId: users.vendor._id, studentUserId: users.student._id })

  console.log('[seed] Done.')
  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('[seed] Failed:', err)
  process.exit(1)
})

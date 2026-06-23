import mongoose from 'mongoose'
import { env } from './env.js'

const DEFAULT_LOCAL_URI = 'mongodb://localhost:27017/svbbs'

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI)
    console.log(`[db] Connected to MongoDB (${env.NODE_ENV})`)
  } catch (err) {
    console.error('\n[db] Could not connect to MongoDB.')
    console.error(`[db] Underlying error: ${err.message}\n`)

    if (env.MONGO_URI === DEFAULT_LOCAL_URI) {
      console.error(
        '[db] MONGO_URI is not set, so this fell back to a local MongoDB at\n' +
          '     localhost:27017 — which isn\'t running on this machine. Either:\n' +
          '       1) Create a free MongoDB Atlas cluster and paste its connection\n' +
          '          string into MONGO_URI in server/.env (recommended — see the\n' +
          '          README Setup section), or\n' +
          '       2) Install and start MongoDB locally if you specifically want\n' +
          '          to run it that way.\n' +
          '     Make sure server/.env actually exists — copy it from .env.example\n' +
          '     first if you haven\'t (`cp .env.example .env`), then re-run.'
      )
    } else {
      console.error(
        '[db] MONGO_URI is set, but the connection still failed. Common causes:\n' +
          '       - The username/password in the connection string is wrong\n' +
          '       - Your current IP isn\'t in the Atlas cluster\'s Network Access\n' +
          '         allowlist (Atlas blocks unknown IPs by default)\n' +
          '       - The cluster is paused, deleted, or the connection string has\n' +
          '         a typo'
      )
    }
    console.error('')
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected')
  })
}

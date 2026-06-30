import { initObservability } from './config/observability.js'

// Initialize error tracking before anything else loads, so failures
// during startup (DB connection, etc.) are also captured.
initObservability()

import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import app from './app.js'

async function start() {
  await connectDB()

  app.listen(env.PORT, () => {
    console.log(`[server] SVBBS API listening on port ${env.PORT} (${env.NODE_ENV})`)
  })
}

start()
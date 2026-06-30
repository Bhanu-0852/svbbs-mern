import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import morgan from 'morgan'

import { env } from './config/env.js'
import { apiLimiter } from './middleware/rateLimiter.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'
import bookRoutes from './routes/books.js'
import aiRoutes from './routes/ai.js'
import walletRoutes from './routes/wallet.js'
import examRoutes from './routes/exams.js'
import passportRoutes from './routes/passport.js'
import vendorRoutes from './routes/vendor.js'
import sustainabilityRoutes from './routes/sustainability.js'
import superAdminRoutes from './routes/superadmin.js'
import recyclerRoutes from './routes/recycler.js'
import collegeRoutes from './routes/college.js'
import csrRoutes from './routes/csr.js'
import parentRoutes from './routes/parent.js'
import notificationRoutes from './routes/notifications.js'
import rfidRoutes from './routes/rfid.js'
import exchangeRoutes from './routes/exchanges.js'
import chatbotRoutes from './routes/chatbot.js'
import exchangeMatchRoutes from './routes/exchangeMatch.js'
import careerMentorRoutes from './routes/careerMentor.js'
// ...each subsequent slice adds its own router here.

const app = express()
app.set('trust proxy', 1)

// Registered before the full middleware chain so this responds as fast
// and lightly as possible — used by the Login page to pre-warm Render's
// free-tier instance out of cold sleep before the user finishes typing
// their credentials. This is the single source of truth for /api/health;
// see the note below about why a second, near-identical handler used to
// exist further down and was removed.
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }))

/**
 * Middleware chain, in order, matching the build plan §9.1:
 * helmet -> cors -> rateLimiter -> cookieParser -> csrf (auth routes only)
 * -> express.json -> route -> validate -> auth -> rbac -> controller
 * -> service -> errorHandler
 *
 * Audit logging isn't a global middleware — auditService.logAudit() is
 * called directly from inside the services that need it (authService,
 * borrowService), since each call needs to attach a specific actor and
 * action rather than a generic "a request happened" log line.
 */

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://covers.openlibrary.org', 'https://res.cloudinary.com'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // required so the HttpOnly refresh-token cookie is sent
  })
)

app.use(apiLimiter)
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(mongoSanitize())

if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/passport', passportRoutes)
app.use('/api/vendor', vendorRoutes)
app.use('/api/sustainability', sustainabilityRoutes)
app.use('/api/superadmin', superAdminRoutes)
app.use('/api/recycler', recyclerRoutes)
app.use('/api/college', collegeRoutes)
app.use('/api/csr', csrRoutes)
app.use('/api/parent', parentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/rfid', rfidRoutes)
app.use('/api/exchanges', exchangeRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/exchange-match', exchangeMatchRoutes)
app.use('/api/career-mentor', careerMentorRoutes)
// ...

app.use(notFoundHandler)
app.use(errorHandler)

export default app
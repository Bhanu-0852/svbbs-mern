import 'dotenv/config'

function required(name, fallback) {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    console.warn(`[env] Warning: ${name} is not set.`)
  }
  return value
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  MONGO_URI: required('MONGO_URI', 'mongodb://localhost:27017/svbbs'),

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',

  // Used to encrypt MFA TOTP secrets at rest. Must be exactly 32 bytes for AES-256.
  ENCRYPTION_KEY: required('ENCRYPTION_KEY', 'dev-32-byte-key-change-this-now!'),

  RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET || '', // empty in dev = mock CAPTCHA always passes

  MOCK_AI: process.env.MOCK_AI !== 'false', // defaults to true so the app runs with no API key
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  
  MOCK_PAYMENTS: process.env.MOCK_PAYMENTS !== 'false',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
}

import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'

if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  })
} else {
  console.log('[uploads] No Cloudinary credentials set — the photo upload pipeline (multer + Cloudinary) has not been built yet, so this is expected for now.')
}

export default cloudinary

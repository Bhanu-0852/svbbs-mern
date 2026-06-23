import mongoose from 'mongoose'

const { Schema } = mongoose

// This model is the target of User.collegeId, which existed in the User
// schema from the original scaffold but had no model behind it until now.
// A college's "scope" is its students (User.collegeId) and, through them,
// their borrowing activity — books themselves belong to vendors, not
// colleges, so the dashboard never claims a college "owns" any books.
const collegeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, default: '' },
    code: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
)

export default mongoose.model('College', collegeSchema)

import Transaction from '../models/Transaction.js'
import Book from '../models/Book.js'
import User from '../models/User.js'
import { generateJson } from './ai/aiProvider.js'

/**
 * ─── AI Career Mentor ───────────────────────────────────────────────────────
 *
 * Generates a personalized career roadmap grounded in a student's REAL
 * activity on the platform — the books they've actually borrowed, their
 * department, semester, and exam interests — rather than generic advice.
 *
 * The roadmap text is AI-generated (this is genuinely a language task), but
 * it's always grounded in real, queried data, and it degrades to a sensible
 * structured fallback if no AI provider is available. Clearly a generative
 * feature, not a trained predictor — labeled as such.
 */

async function buildStudentProfile(userId) {
  const [user, transactions] = await Promise.all([
    User.findById(userId).select('name department semester examInterests'),
    Transaction.find({ userId, type: 'borrow' }).populate('bookId', 'title categoryTags examTags'),
  ])

  const borrowedBooks = transactions
    .filter((t) => t.bookId)
    .map((t) => ({
      title: t.bookId.title,
      categories: t.bookId.categoryTags || [],
      exams: t.bookId.examTags || [],
    }))

  // Aggregate the student's demonstrated interests from real borrow data.
  const categoryCounts = {}
  const examCounts = {}
  borrowedBooks.forEach((b) => {
    b.categories.forEach((c) => (categoryCounts[c] = (categoryCounts[c] || 0) + 1))
    b.exams.forEach((e) => (examCounts[e] = (examCounts[e] || 0) + 1))
  })

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
  const topExams = Object.entries(examCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([e]) => e)

  return {
    name: user?.name || 'Student',
    department: user?.department || null,
    semester: user?.semester || null,
    examInterests: user?.examInterests || topExams,
    topCategories,
    topExams,
    borrowedTitles: borrowedBooks.map((b) => b.title),
    bookCount: borrowedBooks.length,
  }
}

export function buildFallbackRoadmap(profile) {
  const focus = profile.topCategories[0] || profile.department || 'your field'
  return {
    summary: `Based on your ${profile.bookCount} borrowed book${profile.bookCount === 1 ? '' : 's'}, your reading leans toward ${focus}. Here's a starting roadmap — connect a richer AI provider for a deeper, personalized plan.`,
    requiredSkills: ['Core fundamentals of your field', 'Problem-solving practice', 'One strong project'],
    recommendedBooks: ['Browse the Marketplace for advanced titles in your top categories'],
    certifications: ['Look for free certifications relevant to your department'],
    projects: ['Build one portfolio project that demonstrates applied skills'],
    interviewTopics: ['Fundamentals', 'Data structures & algorithms', 'Your department core subjects'],
    weeklyGoals: ['Read consistently', 'Practice problems', 'Make progress on a project'],
    source: 'fallback',
  }
}

export async function generateCareerRoadmap(userId) {
  const profile = await buildStudentProfile(userId)

  const prompt = `Generate a personalized career roadmap for a student with this profile:
- Department: ${profile.department || 'not specified'}
- Semester: ${profile.semester || 'not specified'}
- Exam interests: ${profile.examInterests.length ? profile.examInterests.join(', ') : 'none specified'}
- Most-read subject areas (from real borrowing): ${profile.topCategories.length ? profile.topCategories.join(', ') : 'none yet'}
- Books they've actually read: ${profile.borrowedTitles.slice(0, 8).join(', ') || 'none yet'}

Respond ONLY with valid JSON (no markdown) in this exact shape:
{
  "summary": "2-3 sentence personalized overview of their direction",
  "requiredSkills": ["skill1", "skill2", "skill3", "skill4"],
  "recommendedBooks": ["specific book or topic 1", "2", "3"],
  "certifications": ["cert1", "cert2"],
  "projects": ["project idea 1", "project idea 2", "project idea 3"],
  "interviewTopics": ["topic1", "topic2", "topic3", "topic4"],
  "weeklyGoals": ["goal1", "goal2", "goal3"]
}
Be specific and practical, grounded in their actual department and reading.`

  try {
    const { data } = await generateJson({
      system: 'You are an expert career mentor for engineering and exam-prep students. Give specific, actionable, realistic guidance.',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 900,
      temperature: 0.7,
    })
    return { ...data, profile: { topCategories: profile.topCategories, bookCount: profile.bookCount }, source: 'ai' }
  } catch {
    return { ...buildFallbackRoadmap(profile), profile: { topCategories: profile.topCategories, bookCount: profile.bookCount } }
  }
}
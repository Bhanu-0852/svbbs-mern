import { describe, it, expect } from 'vitest'
import { buildFallbackRoadmap } from '../services/careerMentorService.js'

// The fallback roadmap is what a student sees when no AI provider is
// available. It must always return a complete, non-empty structure so the
// UI never renders blank sections — this test guards that contract.

describe('careerMentor — fallback roadmap shape', () => {
  const profile = {
    name: 'Asha',
    department: 'CSE',
    semester: 5,
    examInterests: ['GATE'],
    topCategories: ['engineering', 'science'],
    topExams: ['GATE'],
    borrowedTitles: ['Clean Code', 'Sapiens'],
    bookCount: 2,
  }

  it('returns every section the UI renders, all non-empty', () => {
    const r = buildFallbackRoadmap(profile)
    expect(r.summary).toBeTruthy()
    expect(r.requiredSkills.length).toBeGreaterThan(0)
    expect(r.recommendedBooks.length).toBeGreaterThan(0)
    expect(r.certifications.length).toBeGreaterThan(0)
    expect(r.projects.length).toBeGreaterThan(0)
    expect(r.interviewTopics.length).toBeGreaterThan(0)
    expect(r.weeklyGoals.length).toBeGreaterThan(0)
  })

  it('marks itself as the fallback source, not AI', () => {
    const r = buildFallbackRoadmap(profile)
    expect(r.source).toBe('fallback')
  })

  it('grounds the summary in the student\'s real reading focus', () => {
    const r = buildFallbackRoadmap(profile)
    // Should reference their top category or department, not be generic.
    expect(r.summary.toLowerCase()).toMatch(/engineering|cse/)
  })

  it('handles a student with no borrow history gracefully', () => {
    const empty = { ...profile, topCategories: [], department: null, bookCount: 0 }
    const r = buildFallbackRoadmap(empty)
    expect(r.summary).toBeTruthy()
    expect(r.requiredSkills.length).toBeGreaterThan(0)
  })
})
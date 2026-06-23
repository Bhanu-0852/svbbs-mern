// Static for now — light enough that a full Mongoose collection isn't
// worth it yet. hasInventory reflects which exams the seed data actually
// tags books for; the others render as "Coming soon" rather than an
// empty, misleading shelf.
export const EXAM_CATEGORIES = [
  {
    code: 'UPSC',
    name: 'UPSC Civil Services',
    overview:
      'Preparation material for the IAS, IPS, and allied civil services examinations — covering history, polity, governance, and current affairs.',
    hasInventory: true,
  },
  {
    code: 'SSC',
    name: 'SSC (Staff Selection Commission)',
    overview:
      'Resources for SSC CGL, CHSL, and related exams — general English, quantitative aptitude, and general awareness.',
    hasInventory: true,
  },
  {
    code: 'Banking',
    name: 'Banking Exams',
    overview:
      'Preparation for IBPS, SBI, and RBI recruitment exams — covering reasoning, quantitative aptitude, and banking awareness.',
    hasInventory: true,
  },
  {
    code: 'Railways',
    name: 'Railway Recruitment (RRB)',
    overview: 'Materials for RRB NTPC, Group D, and technical recruitment exams.',
    hasInventory: true,
  },
  {
    code: 'Defence',
    name: 'Defence Exams (NDA/CDS)',
    overview: 'Preparation for NDA, CDS, and AFCAT entrance examinations.',
    hasInventory: true,
  },
  {
    code: 'APPSC',
    name: 'APPSC',
    overview: 'Andhra Pradesh Public Service Commission examination resources.',
    hasInventory: true,
  },
  {
    code: 'TSPSC',
    name: 'TSPSC',
    overview: 'Telangana State Public Service Commission examination resources.',
    hasInventory: true,
  },
  {
    code: 'GATE',
    name: 'GATE',
    overview:
      'Graduate Aptitude Test in Engineering preparation — core engineering subjects and previous-year problem patterns.',
    hasInventory: true,
  },
  {
    code: 'CAT',
    name: 'CAT (MBA Entrance)',
    overview: 'Common Admission Test preparation for quantitative ability, verbal reasoning, and data interpretation.',
    hasInventory: true,
  },
]

export function getExamByCode(code) {
  return EXAM_CATEGORIES.find((e) => e.code.toLowerCase() === code.toLowerCase())
}

import { Link } from 'react-router-dom'
import { FiBookOpen, FiRefreshCw, FiAward, FiArrowRight } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const PILLARS = [
  {
    icon: FiBookOpen,
    title: 'EdTech',
    body: 'A shared marketplace where students deposit, borrow, and exchange textbooks. Every book earns Knowledge Credits based on its condition and subject, and credits cover most of the cost of borrowing the next one — cash only makes up any shortfall.',
  },
  {
    icon: FiRefreshCw,
    title: 'GreenTech',
    body: 'Books stay in circulation instead of being thrown away. Worn-out copies are routed to a recycler rather than landfill, and the sustainability dashboard tracks books reused, money saved, and waste avoided across the whole platform.',
  },
  {
    icon: FiAward,
    title: 'FinTech',
    body: 'The Knowledge Credit economy is real, double-entry, and auditable: wallets, hybrid KC-plus-cash payments, sponsor grants from CSR partners, and parent top-ups all move the same credits through atomic, transaction-safe operations.',
  },
]

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-16 w-full">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy-900 dark:text-white mb-3">
          About SVBBS
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 mb-12 max-w-2xl leading-relaxed">
          The Smart Vendor Book Bank System is a circular economy for educational resources. It brings
          three ideas together in one platform: a book-sharing marketplace, a credit-based economy that
          makes sharing rewarding, and a recycling loop that keeps books out of landfill.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <span className="grid place-items-center w-10 h-10 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 mb-4">
                <Icon size={18} />
              </span>
              <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-2">
                {title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>

        <Card className="mb-12">
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-2">
            Built for everyone in the loop
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            SVBBS supports seven roles, each with a purpose-built dashboard: students who borrow and
            earn credits, vendors who supply inventory, recyclers who handle end-of-life books, college
            admins who track their institution's activity, CSR sponsors who fund credits for students,
            parents who top up their own child's wallet, and a super admin overseeing the platform. There's
            also a Government Exam Hub with curated collections for UPSC, SSC, Banking, and GATE, and an
            exportable Academic Passport that turns a student's reading history into a shareable record.
          </p>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button as={Link} to="/marketplace" variant="primary">
            Browse the marketplace <FiArrowRight size={15} />
          </Button>
          <Button as={Link} to="/exam-hub" variant="ghost">
            Explore the Exam Hub
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}

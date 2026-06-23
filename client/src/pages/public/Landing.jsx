import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiBookOpen, FiRefreshCw, FiHeart, FiTrendingUp } from 'react-icons/fi'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import BookCover from '../../components/books/BookCover'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const ROLE_HOME = {
  student: '/student',
  vendor: '/vendor',
  college_admin: '/college',
  super_admin: '/superadmin',
  recycler: '/recycler',
  csr_sponsor: '/csr',
  parent: '/parent',
}

const PILLARS = [
  {
    icon: FiBookOpen,
    title: 'Deposit & earn',
    body: 'Give a book a second life and earn Knowledge Credits based on its real condition.',
  },
  {
    icon: FiRefreshCw,
    title: 'Borrow & exchange',
    body: 'Spend Knowledge Credits on books you need, with cash covering any gap.',
  },
  {
    icon: FiHeart,
    title: 'Donate & recycle',
    body: 'Books beyond reuse are recycled responsibly, and every action is tracked.',
  },
  {
    icon: FiTrendingUp,
    title: 'Build your Passport',
    body: 'Every book you touch becomes part of a verified, shareable reading record.',
  },
]

// Each layer's parallax intensity and stacking offset — closer layers
// (later position) move more per pixel of cursor movement and sit
// further forward/down, the standard layered-depth illusion.
const LAYER_CONFIG = [
  { depthFactor: 6, x: -90, y: -40, rotate: -10, z: 0 },
  { depthFactor: 10, x: -20, y: -10, rotate: -4, z: 10 },
  { depthFactor: 15, x: 50, y: 10, rotate: 5, z: 20 },
  { depthFactor: 20, x: 110, y: -20, rotate: 12, z: 30 },
]

/**
 * One book's own component, with its own hook calls — deliberately NOT
 * inlined into a .map() in the parent, since useTransform (like any
 * hook) can't be called conditionally per array item inside a callback;
 * each book needs a stable component instance of its own to call hooks
 * at its own top level, per React's Rules of Hooks.
 *
 * Under prefers-reduced-motion, parallax tracking is simply never
 * applied (springX/springY stay at their initial 0 — see
 * ParallaxBookStack, which never updates them when reduced motion is
 * on) — each book still gets its static layered offset/rotation, just
 * without responding to cursor movement.
 */
function ParallaxBookLayer({ book, layer, index, springX, springY, reduced }) {
  const x = useTransform(springX, (v) => layer.x + v * layer.depthFactor * 10)
  const y = useTransform(springY, (v) => layer.y + v * layer.depthFactor * 10)

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 w-40"
      style={{ x, y, rotate: layer.rotate, zIndex: layer.z, marginLeft: -80, marginTop: -120 }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={
        reduced ? { duration: 0.3 } : { delay: index * 0.08, type: 'spring', stiffness: 200, damping: 22 }
      }
    >
      <BookCover src={book.coverImage} title={book.title} author={book.author} interactive />
    </motion.div>
  )
}

function ParallaxBookStack() {
  const [books, setBooks] = useState(null)
  const prefersReducedMotion = useReducedMotion()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const springX = useSpring(rawX, { stiffness: 120, damping: 20 })
  const springY = useSpring(rawY, { stiffness: 120, damping: 20 })

  useEffect(() => {
    api
      .get('/books', { params: { status: 'available', limit: 4 } })
      .then(({ data }) => setBooks(data.books))
      .catch(() => setBooks([]))
  }, [])

  function handlePointerMove(e) {
    if (prefersReducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    rawX.set((e.clientX - rect.left) / rect.width - 0.5) // -0.5 to 0.5
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handlePointerLeave() {
    rawX.set(0)
    rawY.set(0)
  }

  // Real, live books only — if the fetch fails or there's nothing
  // available yet, the hero simply doesn't show the stack rather than
  // ever faking cover art for books that don't exist.
  if (books === null || books.length === 0) return null

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative hidden lg:block h-[420px] w-full"
      style={prefersReducedMotion ? undefined : { perspective: 1400 }}
      aria-hidden="true"
    >
      {books.slice(0, 4).map((book, i) => (
        <ParallaxBookLayer
          key={book._id}
          book={book}
          layer={LAYER_CONFIG[i] || LAYER_CONFIG[LAYER_CONFIG.length - 1]}
          index={i}
          springX={springX}
          springY={springY}
          reduced={prefersReducedMotion}
        />
      ))}
    </div>
  )
}

export default function Landing() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // If already logged in, send straight to their dashboard — the landing
  // page has nothing useful for an authenticated user.
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_HOME[user.role] || '/student', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // Don't flash the landing page content while the redirect fires
  if (isAuthenticated) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-navy opacity-[0.04] dark:opacity-100 -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-kc-500 mb-4">
                  Knowledge Credit Economy
                </p>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-navy-900 dark:text-white leading-[1.1]">
                  Every book deserves a second reader.
                </h1>
                <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Deposit, borrow, exchange, donate, and recycle textbooks — earn Knowledge Credits
                  for every book you give, and spend them on every book you need.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button variant="kc" size="lg" as={Link} to="/register">
                    Start earning credits <FiArrowRight />
                  </Button>
                  <Button variant="outline" size="lg" as={Link} to="/marketplace">
                    Browse the shelf
                  </Button>
                </div>
              </div>

              <ParallaxBookStack />
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <Card key={title} tilt3d className="text-left">
                <span className="grid place-items-center w-10 h-10 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 mb-4">
                  <Icon size={18} />
                </span>
                <h3 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-1.5">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* KC explainer strip */}
        <section className="bg-navy-900 dark:bg-navy-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-display text-3xl font-semibold text-kc-400">300 KC</p>
              <p className="text-sm text-slate-400 mt-1">For an excellent-condition book</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold text-kc-400">+100 KC</p>
              <p className="text-sm text-slate-400 mt-1">Bonus for rare or specialized titles</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold text-kc-400">Hybrid pay</p>
              <p className="text-sm text-slate-400 mt-1">KC first, cash covers the rest</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

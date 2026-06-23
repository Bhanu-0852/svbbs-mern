import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-navy-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} SVBBS — Smart Vendor Book Bank System
        </p>
        <div className="flex items-center gap-5 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/about" className="hover:text-navy-900 dark:hover:text-white">About</Link>
          <Link to="/sustainability" className="hover:text-navy-900 dark:hover:text-white">Impact</Link>
          <Link to="/exam-hub" className="hover:text-navy-900 dark:hover:text-white">Exam Hub</Link>
        </div>
      </div>
    </footer>
  )
}

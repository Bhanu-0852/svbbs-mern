import { Link } from 'react-router-dom'
import { FiBookOpen } from 'react-icons/fi'
import Button from '../../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <span className="grid place-items-center w-14 h-14 rounded-full bg-slate-100 dark:bg-navy-700 text-slate-400 mb-6">
        <FiBookOpen size={24} />
      </span>
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
        This shelf is empty
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        The page you're looking for doesn't exist, or may have moved.
      </p>
      <Button as={Link} to="/" variant="primary" className="mt-6">
        Back to the marketplace
      </Button>
    </div>
  )
}

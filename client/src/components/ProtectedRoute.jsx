import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiLoader } from 'react-icons/fi'

/**
 * Frontend route guard. This is a UX convenience only — the real
 * authorization boundary is server-side RBAC (middleware/rbac.js),
 * which is checked on every request regardless of what this component
 * allows through (spec §9.7: never rely on frontend checks alone).
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

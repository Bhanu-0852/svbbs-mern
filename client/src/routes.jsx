import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

import RouteLoadingFallback from './components/layout/RouteLoadingFallback'
import ProtectedRoute from './components/ProtectedRoute'

// Every page is loaded on demand rather than bundled into one ~700KB
// chunk upfront. This matters most for the role dashboards — most of
// them (and the public Sustainability page) pull in Recharts, which is
// heavy, and a given visitor only ever needs ONE role's dashboard, never
// all seven. A single Suspense boundary below covers all of them with
// one small loading spinner instead of wrapping every route individually.
const Landing = lazy(() => import('./pages/public/Landing'))
const Login = lazy(() => import('./pages/public/Login'))
const Register = lazy(() => import('./pages/public/Register'))
const VerifyEmail = lazy(() => import('./pages/public/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/public/ResetPassword'))
const Marketplace = lazy(() => import('./pages/public/Marketplace'))
const BookDetail = lazy(() => import('./pages/public/BookDetail'))
const ExamHub = lazy(() => import('./pages/public/ExamHub'))
const ExamCategoryDetail = lazy(() => import('./pages/public/ExamCategoryDetail'))
const Sustainability = lazy(() => import('./pages/public/Sustainability'))
const About = lazy(() => import('./pages/public/About'))
const NotFound = lazy(() => import('./pages/public/NotFound'))

const AccountSecurity = lazy(() => import('./pages/account/Security'))

const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const AcademicPassport = lazy(() => import('./pages/student/Passport'))
const StudentDeposit = lazy(() => import('./pages/student/Deposit'))
const VendorDashboard = lazy(() => import('./pages/vendor/Dashboard'))
const VendorRfid = lazy(() => import('./pages/vendor/Rfid'))
const CollegeAdminDashboard = lazy(() => import('./pages/college/Dashboard'))
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'))
const RecyclerDashboard = lazy(() => import('./pages/recycler/Dashboard'))
const CSRDashboard = lazy(() => import('./pages/csr/Dashboard'))
const ParentDashboard = lazy(() => import('./pages/parent/Dashboard'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<BookDetail />} />
        <Route path="/exam-hub" element={<ExamHub />} />
        <Route path="/exam-hub/:code" element={<ExamCategoryDetail />} />
        <Route path="/sustainability" element={<Sustainability />} />
        <Route path="/about" element={<About />} />

        {/* Authenticated, any role */}
        <Route
          path="/account/security"
          element={
            <ProtectedRoute>
              <AccountSecurity />
            </ProtectedRoute>
          }
        />

        {/* Role-guarded dashboards. Frontend guard is UX only — the real
            authorization boundary is server-side RBAC on every API call. */}
        <Route
          path="/student/passport"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AcademicPassport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/deposit"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDeposit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/rfid"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorRfid />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/*"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/college/*"
          element={
            <ProtectedRoute allowedRoles={['college_admin']}>
              <CollegeAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recycler/*"
          element={
            <ProtectedRoute allowedRoles={['recycler']}>
              <RecyclerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/csr/*"
          element={
            <ProtectedRoute allowedRoles={['csr_sponsor']}>
              <CSRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/*"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

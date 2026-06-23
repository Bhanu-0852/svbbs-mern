import { Suspense, lazy } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import AppRoutes from './routes'

const KnowledgeBotWidget = lazy(() => import('./components/layout/KnowledgeBotWidget'))

export default function App() {
  return (
    <ErrorBoundary>
      {/* No app-level MotionConfig wrapper here, deliberately — importing
          framer-motion at this root, always-eager component would risk
          pulling the whole library out of its own lazily-fetched,
          cacheable chunk and into the main bundle every visitor
          downloads, even ones who never reach a page with a 3D effect.
          Instead, every component that uses framer-motion for a 3D
          effect (BookCover, Card, Modal, Button, KCBalance, BookGrid,
          the Landing hero) calls useReducedMotion() itself and branches
          its own animation accordingly — zero extra bundle cost, since
          those components already import framer-motion for the motion
          effects themselves. The existing global CSS rule in index.css
          covers everything that isn't framer-motion-driven. */}
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
              <Suspense fallback={null}>
                <KnowledgeBotWidget />
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

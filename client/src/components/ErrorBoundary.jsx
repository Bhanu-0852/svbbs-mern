import { Component } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import Button from './ui/Button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // In later slices this reports to the server-side AuditLog / monitoring.
    console.error('SVBBS render error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false })
    window.location.assign('/')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <span className="grid place-items-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mb-6">
            <FiAlertTriangle size={24} />
          </span>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            We hit an unexpected error. Try going back to the homepage — if it keeps
            happening, let us know what you were doing.
          </p>
          <Button onClick={this.handleReset} variant="primary" className="mt-6">
            Go home
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

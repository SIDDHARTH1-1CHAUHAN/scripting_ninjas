'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <div className="font-pixel text-2xl mb-4 text-warning">SYSTEM_ERROR</div>
            <p className="text-sm opacity-70 mb-6">Something went wrong. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-dark text-canvas px-6 py-3 font-pixel"
            >
              RELOAD_PAGE
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '32px',
          backgroundColor: '#0d0f14',
          color: '#f87171',
          fontFamily: 'monospace',
          fontSize: '13px',
          minHeight: '100vh',
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 700, fontSize: '15px' }}>
            Runtime Error — check console for full stack trace
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#fca5a5' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#6b7280', marginTop: '16px', fontSize: '11px' }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              backgroundColor: '#1e2028',
              color: '#e5e7eb',
              border: '1px solid #2a2d3a',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Dismiss and retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

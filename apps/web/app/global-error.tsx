'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0A0A12', color: '#F6F2E8', fontFamily: '-apple-system, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 32,
        }}>
          <div style={{ fontSize: 48 }}>⚠</div>
          <h1 style={{ color: '#F6F2E8', fontSize: 24, margin: 0, fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#7A7787', textAlign: 'center', maxWidth: 400, margin: 0, lineHeight: 1.6 }}>
            An unexpected error occurred.
            {error.digest && (
              <>
                <br />
                <code style={{ fontSize: 12 }}>Reference: {error.digest}</code>
              </>
            )}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                background: 'var(--gold)',
                color: '#0A0A12',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '12px 24px',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}

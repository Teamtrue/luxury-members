'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: 32,
      background: 'var(--obsidian)',
    }}>
      <div style={{ fontSize: 48 }}>⚠</div>
      <h2 style={{ color: 'var(--cream)', fontSize: 24, margin: 0, fontWeight: 600 }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--mute)', textAlign: 'center', maxWidth: 400, margin: 0, lineHeight: 1.6 }}>
        An unexpected error occurred. Our team has been notified.
        {error.digest && (
          <>
            <br />
            <code style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
              Reference: {error.digest}
            </code>
          </>
        )}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            background: 'var(--gold)',
            color: 'var(--obsidian)',
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
  )
}

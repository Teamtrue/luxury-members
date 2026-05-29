import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--obsidian)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: 32,
    }}>
      <div style={{
        fontSize: 96,
        fontWeight: 200,
        color: 'var(--gold)',
        lineHeight: 1,
        letterSpacing: '-4px',
      }}>
        404
      </div>
      <h1 style={{ color: 'var(--cream)', fontSize: 24, margin: 0, fontWeight: 600 }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--mute)', textAlign: 'center', maxWidth: 400, margin: 0, lineHeight: 1.6 }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <Link
          href="/"
          style={{
            padding: '12px 24px',
            background: 'var(--gold)',
            color: 'var(--obsidian)',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Go Home
        </Link>
        <Link
          href="/signin"
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
          Sign In
        </Link>
      </div>
    </div>
  )
}

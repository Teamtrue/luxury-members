'use client';

/**
 * components/ui/CookieConsent.tsx
 * ---------------------------------------------------------------------------
 * GDPR / DPDP-compliant cookie consent banner.
 *
 * - Persists choice in localStorage ('plutus_cookie_consent': 'accepted' | 'rejected')
 * - Only shown once per browser session until consent is given
 * - Does NOT fire GA4 until consent is accepted
 * - Calls optional `onAccept` / `onReject` callbacks for the host layout to
 *   enable/disable analytics scripts accordingly.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'plutus_cookie_consent';

export type ConsentValue = 'accepted' | 'rejected';

interface CookieConsentProps {
  onAccept?: () => void;
  onReject?: () => void;
}

export function CookieConsent({ onAccept, onReject }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ConsentValue | null;
      if (!stored) {
        setVisible(true);
      } else if (stored === 'accepted') {
        onAccept?.();
      }
    } catch {
      // localStorage blocked (e.g. private browsing) — show banner
      setVisible(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAccept() {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch { /* no-op */ }
    setVisible(false);
    window.dispatchEvent(new Event('plutus:cookie-accepted'));
    onAccept?.();
  }

  function handleReject() {
    try { localStorage.setItem(STORAGE_KEY, 'rejected'); } catch { /* no-op */ }
    setVisible(false);
    onReject?.();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      style={{
        position:     'fixed',
        bottom:       24,
        left:         '50%',
        transform:    'translateX(-50%)',
        zIndex:       9999,
        maxWidth:     680,
        width:        'calc(100% - 32px)',
        background:   'var(--ink, #12121E)',
        border:       '1px solid var(--line-dk, rgba(255,255,255,0.08))',
        borderRadius: 12,
        padding:      '20px 24px',
        display:      'flex',
        alignItems:   'center',
        gap:          20,
        boxShadow:    '0 8px 40px rgba(0,0,0,0.6)',
        flexWrap:     'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--cream, #F6F2E8)', lineHeight: 1.5 }}>
          We use essential cookies to keep you signed in and optional analytics cookies
          (GA4) to improve the experience.{' '}
          <Link href="/privacy" style={{ color: 'var(--gold, #C9A961)', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button
          onClick={handleReject}
          style={{
            height:       36,
            padding:      '0 18px',
            background:   'transparent',
            border:       '1px solid var(--line-dk, rgba(255,255,255,0.12))',
            borderRadius: 6,
            color:        'var(--silver, #A0A0B0)',
            fontSize:     13,
            cursor:       'pointer',
            fontFamily:   'inherit',
            transition:   'border-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--gold, #C9A961)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--line-dk, rgba(255,255,255,0.12))')}
        >
          Reject optional
        </button>

        <button
          onClick={handleAccept}
          style={{
            height:       36,
            padding:      '0 20px',
            background:   'var(--gold, #C9A961)',
            border:       '1px solid var(--gold, #C9A961)',
            borderRadius: 6,
            color:        'var(--obsidian, #0A0A12)',
            fontSize:     13,
            fontWeight:   700,
            cursor:       'pointer',
            fontFamily:   'inherit',
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}

/**
 * Read the persisted consent value synchronously (client-side only).
 * Returns null if no choice has been made yet.
 */
export function getStoredConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY) as ConsentValue | null;
  } catch {
    return null;
  }
}

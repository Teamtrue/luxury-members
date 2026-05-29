'use client';

/**
 * components/ui/GA4Script.tsx
 * ---------------------------------------------------------------------------
 * Consent-aware Google Analytics 4 loader.
 *
 * Only injects gtag scripts after the user has accepted cookies.
 * Call `enableGA4()` from the CookieConsent onAccept callback.
 *
 * The GA4 measurement ID is read from NEXT_PUBLIC_GA4_ID.
 * If the env var is missing, this component silently does nothing.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getStoredConsent } from '@/components/ui/CookieConsent';

export function GA4Script() {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA4_ID;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Activate immediately if consent was already given in a previous session
    if (getStoredConsent() === 'accepted') {
      setEnabled(true);
    }

    // Listen for the custom event fired by CookieConsent onAccept
    function handleConsent() { setEnabled(true); }
    window.addEventListener('plutus:cookie-accepted', handleConsent);
    return () => window.removeEventListener('plutus:cookie-accepted', handleConsent);
  }, []);

  if (!gaMeasurementId || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaMeasurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

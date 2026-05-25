import type { ReactNode } from 'react';
import { assertProductionSecrets } from '@/lib/security/env-guard';
import './globals.css';

assertProductionSecrets();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" style={{ position: 'absolute', left: -9999, top: 0 }}>
          Skip to main content
        </a>

        <div className="site-shell">
          <header className="site-nav">
            <div className="site-nav-inner">
              <a className="brand" href="/">PlutusClub</a>
              <nav className="nav-links" aria-label="Primary navigation">
                <a className="nav-pill" href="/member/support">Support</a>
                <a className="nav-pill" href="/member/value">Value</a>
                <a className="nav-pill" href="/trust-center">Trust</a>
                <a className="nav-pill" href="/admin/ops">Admin Ops</a>
                <a className="nav-pill" href="/privacy">Privacy</a>
              </nav>
            </div>
          </header>

          <main id="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}

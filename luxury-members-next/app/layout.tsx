import type { ReactNode } from 'react';
import { assertProductionSecrets } from '@/lib/security/env-guard';

assertProductionSecrets();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" style={{ position: 'absolute', left: -9999, top: 0 }}>
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}

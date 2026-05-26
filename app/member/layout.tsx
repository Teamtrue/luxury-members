'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PCLogo } from '@/components/ui/PCLogo';
import { TierBadge } from '@/components/ui/TierBadge';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/member',
    exact: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Deals',
    href: '/member/deals',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    label: 'My Bookings',
    href: '/member/bookings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Token Wallet',
    href: '/member/wallet',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: 'Referrals',
    href: '/member/referral',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: 'Concierge',
    href: '/member/concierge',
    isPlatinum: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/member/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--obsidian)' }}>
      {/* Top Bar */}
      <header style={{
        height: 60,
        background: 'var(--obsidian)',
        borderBottom: '1px solid var(--line-dk)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}>
        {/* Hamburger — visible on mobile via CSS */}
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div style={{ flexShrink: 0 }}>
          <PCLogo size={24} href="/" />
        </div>

        {/* Search — hidden on mobile via CSS class */}
        <div className="topbar-search" style={{ flex: 1, maxWidth: 480, margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mute-dk)' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="pc-input"
              style={{ paddingLeft: 38, height: 36, fontSize: 13 }}
              placeholder="Search deals, categories..."
              aria-label="Search deals and categories"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, marginLeft: 'auto' }}>
          {/* Bell */}
          <button
            aria-label="Notifications"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', padding: 0, display: 'flex' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mute-dk)" strokeWidth="1.8">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--gold)', border: '1.5px solid var(--obsidian)',
            }} />
          </button>

          {/* Avatar */}
          <button
            aria-label="Account menu"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--gold)', color: 'var(--obsidian)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
              cursor: 'pointer', flexShrink: 0,
              border: 'none',
            }}
          >
            AM
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', marginTop: 60, flex: 1 }}>
        {/* Desktop Sidebar */}
        <aside
          className="sidebar-desktop"
          style={{
            width: 240,
            background: 'var(--ink)',
            borderRight: '1px solid var(--line-dk)',
            position: 'fixed',
            top: 60,
            bottom: 0,
            left: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 12px',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }} aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-item', isActive(item) && 'active')}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.isPlatinum && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--gold)', flexShrink: 0,
                  }} aria-label="Platinum only" />
                )}
              </Link>
            ))}
          </nav>

          {/* Member card */}
          <div style={{
            marginTop: 16,
            padding: '14px 14px',
            border: '1px solid rgba(201,169,97,0.25)',
            borderRadius: 12,
            background: 'var(--ink2)',
          }}>
            <TierBadge tier="platinum" />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>4,820 PC</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>
              Aarav Mehta
            </p>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="sidebar-mobile-overlay"
            onClick={() => setSidebarOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="sidebar-mobile-panel" onClick={e => e.stopPropagation()}>
              <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close navigation menu"
                  style={{ background: 'transparent', border: 'none', color: 'var(--mute-dk)', cursor: 'pointer', fontSize: 20 }}
                >
                  ✕
                </button>
              </div>
              <nav aria-label="Mobile navigation">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('nav-item', isActive(item) && 'active')}
                    aria-label={item.label}
                    aria-current={isActive(item) ? 'page' : undefined}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.isPlatinum && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--gold)', flexShrink: 0,
                      }} aria-label="Platinum only" />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Member card in mobile sidebar */}
              <div style={{
                margin: '16px 12px 0',
                padding: '14px',
                border: '1px solid rgba(201,169,97,0.25)',
                borderRadius: 12,
                background: 'var(--ink2)',
              }}>
                <TierBadge tier="platinum" />
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>4,820 PC</span>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>
                  Aarav Mehta
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main
          className="main-content-with-sidebar"
          style={{
            marginLeft: 240,
            flex: 1,
            overflowY: 'auto',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

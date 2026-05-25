'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    label: 'Members',
    href: '/admin',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Deals',
    href: '/admin/deals',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line strokeLinecap="round" x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <line strokeLinecap="round" x1="18" y1="20" x2="18" y2="10" />
        <line strokeLinecap="round" x1="12" y1="20" x2="12" y2="4" />
        <line strokeLinecap="round" x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Referrals',
    href: '/admin/referrals',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--obsidian)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '220px' : '60px',
          background: 'var(--ink)',
          borderRight: '1px solid var(--line-dk)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            padding: '20px 16px 16px',
            borderBottom: '1px solid var(--line-dk)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--obsidian)">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--obsidian)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          {sidebarOpen && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                whiteSpace: 'nowrap',
              }}
            >
              PlutusClub
            </span>
          )}
        </div>

        {/* Admin badge */}
        {sidebarOpen && (
          <div style={{ padding: '8px 16px 4px' }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--mute-dk)',
              }}
            >
              Admin Panel
            </span>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ padding: '8px 8px', flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive(item.href) ? ' active' : ''}`}
              style={{
                marginBottom: 2,
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                paddingLeft: sidebarOpen ? 16 : 0,
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--line-dk)' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: '100%',
              height: 36,
              background: 'transparent',
              border: '1px solid var(--line-dk)',
              borderRadius: 6,
              color: 'var(--mute-dk)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              transition: 'border-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--line-dk)')}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header
          style={{
            height: 56,
            background: 'var(--ink)',
            borderBottom: '1px solid var(--line-dk)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--cream)',
                letterSpacing: '0.5px',
              }}
            >
              PlutusClub Admin
            </span>
            <span
              style={{
                fontSize: 10,
                background: 'rgba(201,169,97,0.15)',
                color: 'var(--gold)',
                padding: '2px 8px',
                borderRadius: 20,
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Internal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Notification bell */}
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--mute-dk)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* Admin avatar + logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--gold-deep), var(--gold))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--obsidian)',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}
              >
                AD
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>Admin</span>
                <span style={{ fontSize: 11, color: 'var(--mute-dk)' }}>Super Admin</span>
              </div>
              <button
                className="btn-ghost"
                style={{
                  height: 32,
                  padding: '0 14px',
                  fontSize: 11,
                  letterSpacing: '1px',
                  marginLeft: 8,
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--obsidian)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

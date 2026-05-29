import { brand } from '@/lib/brand';

export const metadata = {
  title: `Ops Dashboard — ${brand.name} Admin`,
};

const pageStyle: React.CSSProperties = {
  padding: '32px 24px',
  maxWidth: 960,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--charcoal)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: 24,
  marginBottom: 20,
};

const CRON_JOBS = [
  {
    name: 'Renewal Reminders',
    route: '/api/internal/lifecycle/reminders',
    schedule: 'Daily 9am IST',
    description: 'Emails members with membership expiring in ≤30 days.',
  },
  {
    name: 'Notification Dispatch',
    route: '/api/internal/notifications/dispatch',
    schedule: 'Every 5 minutes',
    description: 'Flushes queued notification jobs.',
  },
  {
    name: 'Finance Close',
    route: '/api/internal/finance/close',
    schedule: 'Daily midnight',
    description: 'Auto-closes matched payment reconciliation records.',
  },
  {
    name: 'Refund Processing',
    route: '/api/internal/refunds/process',
    schedule: 'Every 15 minutes',
    description: 'Initiates approved refunds via Razorpay.',
  },
];

export default function AdminOpsPage() {
  return (
    <div style={pageStyle}>
      <h1 style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 500, color: 'var(--cream)', marginBottom: 8 }}>
        Operations Dashboard
      </h1>
      <p style={{ fontSize: 14, color: 'var(--silver)', marginBottom: 32 }}>
        Cron job status, queue health, and system configuration.
      </p>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 16 }}>
        Scheduled jobs
      </h2>

      {CRON_JOBS.map((job) => (
        <div key={job.name} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>{job.name}</p>
              <p style={{ fontSize: 13, color: 'var(--silver)' }}>{job.description}</p>
            </div>
            <span style={{
              fontSize: 12,
              padding: '3px 10px',
              background: 'rgba(197,168,105,0.1)',
              color: 'var(--gold)',
              borderRadius: 20,
              whiteSpace: 'nowrap',
              marginLeft: 16,
            }}>
              {job.schedule}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(168,168,168,0.5)', fontFamily: 'monospace' }}>
            {job.route}
          </p>
        </div>
      ))}

      <div style={{ marginTop: 32, ...cardStyle }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)', marginBottom: 12 }}>Queue health</p>
        <p style={{ fontSize: 14, color: 'var(--silver)', lineHeight: 1.7 }}>
          BullMQ worker connects to Upstash Redis. Check Upstash dashboard for real-time
          queue lengths and job failure rates. Worker logs are available in the deployment
          platform (Vercel Functions / Railway).
        </p>
      </div>
    </div>
  );
}

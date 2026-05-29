/**
 * Smart notification timing — per-member optimal send-time based on engagement history.
 * Called from notification dispatch before scheduling delivery.
 */

const DEFAULT_HOUR_IST = 10; // 10 AM IST default

export interface MemberEngagementHistory {
  member_id: string;
  notification_opens: Array<{ sent_at: string; opened_at: string | null }>;
  session_times: Array<{ started_at: string; duration_seconds: number }>;
  booking_times: Array<{ created_at: string }>;
}

export interface OptimalSendTime {
  member_id: string;
  recommended_hour_ist: number;
  confidence: number;
  default_used: boolean;
  engagement_probability: number;
}

function toISTHour(isoString: string): number {
  const d = new Date(isoString);
  // IST = UTC+5:30
  return (d.getUTCHours() + 5 + Math.floor((d.getUTCMinutes() + 30) / 60)) % 24;
}

export function getOptimalSendTime(history: MemberEngagementHistory): OptimalSendTime {
  const opens = history.notification_opens.filter(n => n.opened_at !== null);

  if (opens.length < 5) {
    return {
      member_id: history.member_id,
      recommended_hour_ist: DEFAULT_HOUR_IST,
      confidence: 0,
      default_used: true,
      engagement_probability: 0.15,
    };
  }

  // Build hourly open-rate histogram
  const counts = new Array(24).fill(0);
  for (const n of opens) {
    counts[toISTHour(n.sent_at)]++;
  }

  // Smooth with 3-hour rolling window
  const smoothed = counts.map((_, h) =>
    (counts[(h + 23) % 24] + counts[h] + counts[(h + 1) % 24]) / 3
  );

  const peakHour = smoothed.indexOf(Math.max(...smoothed));
  const totalOpens = opens.length;
  const windowOpens = smoothed[peakHour] * 3;
  const engagement_probability = Math.min(windowOpens / Math.max(totalOpens, 1), 1);
  const confidence = Math.min(totalOpens / 20, 1); // full confidence at 20+ opens

  return {
    member_id: history.member_id,
    recommended_hour_ist: peakHour,
    confidence,
    default_used: false,
    engagement_probability,
  };
}

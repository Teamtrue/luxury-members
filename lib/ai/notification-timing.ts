/**
 * lib/ai/notification-timing.ts
 *
 * Per-member optimal notification timing using engagement history.
 * Builds a 24-hour histogram of open/session probability and finds the
 * peak 3-hour window. Falls back to 10 AM IST if history is insufficient.
 */

export interface MemberEngagementHistory {
  member_id: string;
  notification_opens: Array<{
    sent_at: string;
    opened_at: string | null;
  }>;
  session_times: Array<{
    started_at: string;
    duration_seconds: number;
  }>;
  booking_times: Array<{
    created_at: string;
  }>;
}

export interface OptimalSendTime {
  member_id: string;
  recommended_hour_ist: number;
  confidence: number;
  default_used: boolean;
  engagement_probability: number;
}

const IST_OFFSET_HOURS = 5.5;
const DEFAULT_HOUR_IST = 10;
const MIN_HISTORY_FOR_CONFIDENCE = 5;

function utcHourToIST(isoString: string): number {
  const utcHour = new Date(isoString).getUTCHours();
  const utcMinutes = new Date(isoString).getUTCMinutes();
  const istDecimalHour = utcHour + utcMinutes / 60 + IST_OFFSET_HOURS;
  return Math.floor(istDecimalHour % 24);
}

export function getOptimalSendTime(history: MemberEngagementHistory): OptimalSendTime {
  // Collect open events with IST hour.
  const openedNotifications = history.notification_opens.filter(n => n.opened_at !== null);

  if (openedNotifications.length < MIN_HISTORY_FOR_CONFIDENCE) {
    return {
      member_id: history.member_id,
      recommended_hour_ist: DEFAULT_HOUR_IST,
      confidence: 0,
      default_used: true,
      engagement_probability: 0.15, // baseline open rate
    };
  }

  // Build hourly histogram from opens, sessions (weighted 0.5), and bookings (weighted 1.5).
  const histogram = new Array<number>(24).fill(0);

  for (const n of openedNotifications) {
    const hour = utcHourToIST(n.opened_at!);
    histogram[hour] += 1.0;
  }
  for (const s of history.session_times) {
    const hour = utcHourToIST(s.started_at);
    histogram[hour] += 0.5;
  }
  for (const b of history.booking_times) {
    const hour = utcHourToIST(b.created_at);
    histogram[hour] += 1.5;
  }

  // Find the 3-hour window with the highest cumulative score.
  let bestWindowStart = DEFAULT_HOUR_IST;
  let bestWindowScore = -1;
  const total = histogram.reduce((s, v) => s + v, 1); // avoid div-by-zero

  for (let h = 0; h < 24; h++) {
    const windowScore =
      histogram[h] +
      histogram[(h + 1) % 24] +
      histogram[(h + 2) % 24];
    if (windowScore > bestWindowScore) {
      bestWindowScore = windowScore;
      bestWindowStart = h;
    }
  }

  // Recommended hour is the midpoint of the best window.
  const recommendedHour = (bestWindowStart + 1) % 24;
  const engagementProbability = Math.min(0.95, (histogram[recommendedHour] + 0.5) / total * 24);

  // Confidence scales with amount of history.
  const confidence = Math.min(1, openedNotifications.length / 20);

  return {
    member_id: history.member_id,
    recommended_hour_ist: recommendedHour,
    confidence,
    default_used: false,
    engagement_probability: engagementProbability,
  };
}

export interface ScheduledNotification {
  notification_id: string;
  member_id: string;
  send_at: string;
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Schedule a notification at the member's optimal send time.
 * If optimal time is within the next 2 hours, schedule immediately (send_at = now).
 */
export async function scheduleNotification(
  notification: Omit<ScheduledNotification, 'send_at'>,
  history: MemberEngagementHistory
): Promise<ScheduledNotification> {
  const optimal = getOptimalSendTime(history);

  const now = new Date();
  const nowIST = now.getUTCHours() + IST_OFFSET_HOURS;
  const diffHours = (optimal.recommended_hour_ist - nowIST + 24) % 24;

  // If optimal window is within 2 hours or confidence is low, send now.
  const sendNow = diffHours <= 2 || optimal.default_used;

  let send_at: string;
  if (sendNow) {
    send_at = now.toISOString();
  } else {
    const sendTime = new Date(now);
    sendTime.setUTCHours(
      Math.floor((optimal.recommended_hour_ist - IST_OFFSET_HOURS + 24) % 24),
      0, 0, 0
    );
    if (sendTime <= now) sendTime.setUTCDate(sendTime.getUTCDate() + 1);
    send_at = sendTime.toISOString();
  }

  return { ...notification, send_at };
}

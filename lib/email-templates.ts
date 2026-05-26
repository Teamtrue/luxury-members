/**
 * lib/email-templates.ts
 *
 * Pure HTML email template functions for PlutusClub transactional emails.
 *
 * All functions are pure (no side effects, no imports from providers or DB).
 * They return { subject, html, text } ready to pass to EmailProvider.sendEmail().
 *
 * Design principles:
 *   - Inline styles only (email clients strip external CSS).
 *   - Text-forward layout; minimal decorative HTML.
 *   - Brand palette: obsidian #0A0A12, gold #C9A961, cream #F6F2E8.
 *   - Footer includes: PlutusClub name, unsubscribe notice, CIN.
 *
 * TODO: AI — Feed send-time data and open-rate signals into a personalised
 *       delivery-time optimisation model.  Each member's optimal send window
 *       can be stored in user_profiles and applied at queue-dispatch time.
 */

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const BRAND = {
  name: 'PlutusClub',
  obsidian: '#0A0A12',
  gold: '#C9A961',
  cream: '#F6F2E8',
  cin: 'U74999MH2024PTC000000', // placeholder CIN — update when incorporated
  supportEmail: 'support@plutusclub.in',
  website: 'https://plutusclub.in',
} as const

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.obsidian};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.obsidian};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background-color:#111118;border:1px solid #2a2a3a;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #2a2a3a;">
              <span style="font-size:22px;font-weight:bold;letter-spacing:2px;color:${BRAND.gold};">
                ${BRAND.name.toUpperCase()}
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;color:${BRAND.cream};font-size:15px;line-height:1.7;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a3a;font-size:12px;color:#6b6b8a;line-height:1.6;">
              <p style="margin:0 0 6px;">
                © ${new Date().getFullYear()} ${BRAND.name} &nbsp;|&nbsp;
                CIN: ${BRAND.cin}
              </p>
              <p style="margin:0 0 6px;">
                Questions? Email us at
                <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.gold};text-decoration:none;">${BRAND.supportEmail}</a>
              </p>
              <p style="margin:0;">
                You received this email because you are a ${BRAND.name} member.
                To manage notification preferences, log in to your account and
                visit <strong>Settings → Notifications</strong>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function goldDivider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND.gold};margin:24px 0;opacity:0.4;" />`
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}"
     style="display:inline-block;margin-top:20px;padding:12px 28px;
            background-color:${BRAND.gold};color:${BRAND.obsidian};
            font-weight:bold;font-size:14px;letter-spacing:1px;
            text-decoration:none;border-radius:4px;">${label}</a>`
}

// ---------------------------------------------------------------------------
// Data types for structured emails
// ---------------------------------------------------------------------------

export interface BookingEmailData {
  memberName: string
  bookingRef: string
  dealTitle: string
  brand: string
  amountPaid: string        // formatted string, e.g. "₹2,499"
  tokensEarned: number
  tokensUsed: number
  deliveryAddress: string
  estimatedDelivery?: string
}

// ---------------------------------------------------------------------------
// 1. Welcome email
// ---------------------------------------------------------------------------

export function welcomeEmail(
  name: string,
  tier: string,
  tokenBalance: number
): { subject: string; html: string; text: string } {
  const tierFormatted = tier.charAt(0).toUpperCase() + tier.slice(1)
  const subject = `Welcome to ${BRAND.name}, ${name} — Your ${tierFormatted} membership is active`

  const html = emailShell(`
    <h1 style="margin:0 0 16px;font-size:24px;color:${BRAND.gold};font-weight:normal;">
      Welcome, ${name}.
    </h1>
    <p style="margin:0 0 16px;">
      Your <strong style="color:${BRAND.gold};">${tierFormatted}</strong> membership with
      ${BRAND.name} is now active. You are part of an exclusive circle of members who access
      India's finest brands at members-only prices.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 8px;font-size:13px;color:#9999b8;text-transform:uppercase;letter-spacing:1px;">
      Your Starting Balance
    </p>
    <p style="margin:0 0 24px;font-size:28px;font-weight:bold;color:${BRAND.gold};">
      ${tokenBalance.toLocaleString('en-IN')} PC Tokens
    </p>
    <p style="margin:0 0 16px;">
      Use your tokens to offset the price of any booking — 1 token = ₹0.50.
      Earn more tokens on every purchase, every referral, and through exclusive
      member events.
    </p>
    ${ctaButton(`${BRAND.website}/deals`, 'Explore Member Deals')}
    ${goldDivider()}
    <p style="margin:0;font-size:13px;color:#9999b8;">
      Need help getting started? Reply to this email or visit
      <a href="${BRAND.website}/support" style="color:${BRAND.gold};">${BRAND.website}/support</a>.
    </p>
  `)

  const text = `Welcome to ${BRAND.name}, ${name}!

Your ${tierFormatted} membership is now active.

Starting token balance: ${tokenBalance.toLocaleString('en-IN')} PC Tokens
(1 token = ₹0.50)

Explore member deals at: ${BRAND.website}/deals

Questions? Email ${BRAND.supportEmail}

${BRAND.name} | CIN: ${BRAND.cin}`

  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// 2. OTP email
// ---------------------------------------------------------------------------

export function otpEmail(
  otp: string,
  expiryMinutes: number
): { subject: string; html: string; text: string } {
  const subject = `Your ${BRAND.name} verification code: ${otp}`

  const html = emailShell(`
    <h2 style="margin:0 0 24px;font-size:20px;color:${BRAND.cream};font-weight:normal;">
      Email Verification
    </h2>
    <p style="margin:0 0 24px;">
      Use the one-time code below to verify your ${BRAND.name} account.
      This code expires in <strong>${expiryMinutes} minute${expiryMinutes !== 1 ? 's' : ''}</strong>.
    </p>
    <div style="text-align:center;margin:0 0 24px;padding:24px;
                background-color:#0A0A12;border:1px solid ${BRAND.gold};border-radius:6px;">
      <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:${BRAND.gold};">
        ${otp}
      </span>
    </div>
    <p style="margin:0;font-size:13px;color:#9999b8;">
      If you did not request this code, please ignore this email.
      Your account is safe — do not share this code with anyone.
    </p>
  `)

  const text = `Your ${BRAND.name} verification code is: ${otp}

This code expires in ${expiryMinutes} minute${expiryMinutes !== 1 ? 's' : ''}.

Do not share this code with anyone.

If you did not request this, please ignore this email.

${BRAND.name} | CIN: ${BRAND.cin}`

  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// 3. Booking confirmation email
// ---------------------------------------------------------------------------

export function bookingConfirmationEmail(
  booking: BookingEmailData
): { subject: string; html: string; text: string } {
  const {
    memberName,
    bookingRef,
    dealTitle,
    brand,
    amountPaid,
    tokensEarned,
    tokensUsed,
    deliveryAddress,
    estimatedDelivery,
  } = booking

  const subject = `Booking Confirmed: ${bookingRef} — ${dealTitle}`

  const tokenLine =
    tokensUsed > 0
      ? `<tr>
           <td style="padding:6px 0;color:#9999b8;">Tokens Redeemed</td>
           <td style="padding:6px 0;text-align:right;color:${BRAND.cream};">
             ${tokensUsed.toLocaleString('en-IN')} PC Tokens
           </td>
         </tr>`
      : ''

  const html = emailShell(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.gold};font-weight:normal;">
      Booking Confirmed
    </h2>
    <p style="margin:0 0 24px;color:#9999b8;font-size:13px;">
      Reference: <strong style="color:${BRAND.cream};">${bookingRef}</strong>
    </p>
    <p style="margin:0 0 24px;">
      Dear ${memberName}, your booking has been confirmed. Here is a summary:
    </p>

    ${goldDivider()}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="font-size:14px;">
      <tr>
        <td style="padding:6px 0;color:#9999b8;">Deal</td>
        <td style="padding:6px 0;text-align:right;color:${BRAND.cream};">${dealTitle}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#9999b8;">Brand</td>
        <td style="padding:6px 0;text-align:right;color:${BRAND.cream};">${brand}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#9999b8;">Amount Paid</td>
        <td style="padding:6px 0;text-align:right;font-weight:bold;color:${BRAND.gold};">
          ${amountPaid}
        </td>
      </tr>
      ${tokenLine}
      <tr>
        <td style="padding:6px 0;color:#9999b8;">Tokens Earned</td>
        <td style="padding:6px 0;text-align:right;color:${BRAND.cream};">
          +${tokensEarned.toLocaleString('en-IN')} PC Tokens
        </td>
      </tr>
    </table>

    ${goldDivider()}

    <p style="margin:0 0 8px;font-size:13px;color:#9999b8;text-transform:uppercase;letter-spacing:1px;">
      Delivery Address
    </p>
    <p style="margin:0 0 16px;white-space:pre-line;">${deliveryAddress}</p>

    ${
      estimatedDelivery
        ? `<p style="margin:0 0 16px;font-size:13px;color:#9999b8;">
              Estimated delivery: <strong style="color:${BRAND.cream};">${estimatedDelivery}</strong>
           </p>`
        : ''
    }

    ${ctaButton(`${BRAND.website}/bookings`, 'View My Bookings')}
  `)

  const text = `Booking Confirmed — ${bookingRef}

Dear ${memberName},

Deal: ${dealTitle}
Brand: ${brand}
Amount Paid: ${amountPaid}
${tokensUsed > 0 ? `Tokens Redeemed: ${tokensUsed.toLocaleString('en-IN')} PC Tokens\n` : ''}Tokens Earned: +${tokensEarned.toLocaleString('en-IN')} PC Tokens

Delivery Address:
${deliveryAddress}
${estimatedDelivery ? `\nEstimated Delivery: ${estimatedDelivery}\n` : ''}
View your bookings at: ${BRAND.website}/bookings

${BRAND.name} | CIN: ${BRAND.cin}`

  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// 4. Membership renewal reminder
// ---------------------------------------------------------------------------

export function membershipRenewalReminderEmail(
  name: string,
  expiresAt: Date,
  tier: string
): { subject: string; html: string; text: string } {
  const tierFormatted = tier.charAt(0).toUpperCase() + tier.slice(1)
  const expiryDateStr = expiresAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const daysLeft = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  const subject = `Your ${BRAND.name} ${tierFormatted} membership expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`

  const urgencyColor = daysLeft <= 7 ? '#e85c4a' : BRAND.gold

  const html = emailShell(`
    <h2 style="margin:0 0 16px;font-size:20px;color:${urgencyColor};font-weight:normal;">
      Membership Renewal Reminder
    </h2>
    <p style="margin:0 0 16px;">
      Dear ${name}, your <strong style="color:${BRAND.gold};">${tierFormatted}</strong>
      membership expires on
      <strong style="color:${urgencyColor};">${expiryDateStr}</strong>
      — that's <strong style="color:${urgencyColor};">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> away.
    </p>
    <p style="margin:0 0 24px;">
      Renew now to keep access to all your member benefits including exclusive deals,
      PC Token rewards, and priority support.
    </p>
    ${ctaButton(`${BRAND.website}/membership/renew`, 'Renew My Membership')}
    ${goldDivider()}
    <p style="margin:0;font-size:13px;color:#9999b8;">
      If you have already renewed, please ignore this reminder.
      Contact <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.gold};">${BRAND.supportEmail}</a>
      if you need assistance.
    </p>
  `)

  const text = `Membership Renewal Reminder — ${BRAND.name}

Dear ${name},

Your ${tierFormatted} membership expires on ${expiryDateStr} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} away).

Renew now at: ${BRAND.website}/membership/renew

If you have already renewed, ignore this message.
Questions? Email ${BRAND.supportEmail}

${BRAND.name} | CIN: ${BRAND.cin}`

  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// 5. Refund status email
// ---------------------------------------------------------------------------

export function refundStatusEmail(
  name: string,
  status: string,
  amountINR: string
): { subject: string; html: string; text: string } {
  const statusFormatted = status.charAt(0).toUpperCase() + status.slice(1)

  const isApproved = status === 'paid' || status === 'approved' || status === 'processing'
  const isRejected = status === 'rejected'

  const statusColor = isApproved
    ? '#4caf50'
    : isRejected
    ? '#e85c4a'
    : BRAND.gold

  const statusMessage = isApproved
    ? `Your refund of <strong style="color:${statusColor};">${amountINR}</strong> has been ${statusFormatted.toLowerCase()}. Funds should reflect in your original payment method within 5–7 business days.`
    : isRejected
    ? `Unfortunately, your refund request of ${amountINR} has been <strong style="color:${statusColor};">rejected</strong>. Please contact our support team if you have questions.`
    : `Your refund of <strong>${amountINR}</strong> is currently <strong style="color:${statusColor};">${statusFormatted}</strong>. We will notify you once it is processed.`

  const subject = `Refund ${statusFormatted}: ${amountINR} — ${BRAND.name}`

  const html = emailShell(`
    <h2 style="margin:0 0 16px;font-size:20px;color:${statusColor};font-weight:normal;">
      Refund ${statusFormatted}
    </h2>
    <p style="margin:0 0 16px;">Dear ${name},</p>
    <p style="margin:0 0 24px;">${statusMessage}</p>
    ${
      isRejected
        ? ctaButton(
            `mailto:${BRAND.supportEmail}`,
            'Contact Support'
          )
        : ctaButton(`${BRAND.website}/bookings`, 'View My Bookings')
    }
    ${goldDivider()}
    <p style="margin:0;font-size:13px;color:#9999b8;">
      For questions about this refund, contact us at
      <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.gold};">${BRAND.supportEmail}</a>.
    </p>
  `)

  const text = `Refund ${statusFormatted} — ${BRAND.name}

Dear ${name},

Refund amount: ${amountINR}
Status: ${statusFormatted}

${
  isApproved
    ? 'Funds should reflect in your original payment method within 5–7 business days.'
    : isRejected
    ? 'Your refund request has been rejected. Contact us if you have questions.'
    : 'We will notify you once your refund is processed.'
}

Contact: ${BRAND.supportEmail}

${BRAND.name} | CIN: ${BRAND.cin}`

  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// 6. Dispute update email
// ---------------------------------------------------------------------------

export function disputeUpdateEmail(
  name: string,
  status: string,
  resolution?: string
): { subject: string; html: string; text: string } {
  const statusFormatted = status.charAt(0).toUpperCase() + status.slice(1)

  const isResolved = status === 'resolved'
  const isRejected = status === 'rejected'
  const statusColor = isResolved ? '#4caf50' : isRejected ? '#e85c4a' : BRAND.gold

  const statusMessages: Record<string, string> = {
    open: 'Your dispute has been received and is in our queue. We will begin reviewing it within 2 business days.',
    under_review: 'Our finance team is actively reviewing your dispute. We will update you as soon as a decision is reached.',
    resolved: `Your dispute has been <strong style="color:${statusColor};">resolved</strong>.${
      resolution ? ` ${resolution}` : ''
    }`,
    rejected: `Your dispute has been <strong style="color:${statusColor};">rejected</strong>.${
      resolution ? ` ${resolution}` : ' Please contact support if you believe this is in error.'
    }`,
  }

  const bodyText =
    statusMessages[status] ??
    `Your dispute status has been updated to <strong style="color:${statusColor};">${statusFormatted}</strong>.${
      resolution ? ` ${resolution}` : ''
    }`

  const subject = `Dispute Update: ${statusFormatted} — ${BRAND.name}`

  const html = emailShell(`
    <h2 style="margin:0 0 16px;font-size:20px;color:${statusColor};font-weight:normal;">
      Dispute ${statusFormatted}
    </h2>
    <p style="margin:0 0 16px;">Dear ${name},</p>
    <p style="margin:0 0 24px;">${bodyText}</p>
    ${ctaButton(`${BRAND.website}/support`, 'View Dispute Details')}
    ${goldDivider()}
    <p style="margin:0;font-size:13px;color:#9999b8;">
      Have questions? Our support team is available at
      <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.gold};">${BRAND.supportEmail}</a>.
    </p>
  `)

  const text = `Dispute ${statusFormatted} — ${BRAND.name}

Dear ${name},

Your dispute status: ${statusFormatted}
${resolution ? `\nResolution: ${resolution}\n` : ''}
View full details at: ${BRAND.website}/support

Questions? Email ${BRAND.supportEmail}

${BRAND.name} | CIN: ${BRAND.cin}`

  return { subject, html, text }
}

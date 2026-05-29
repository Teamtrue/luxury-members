import Link from 'next/link';
import { PCLogo } from '@/components/ui/PCLogo';
import { brand } from '@/lib/brand';

export const metadata = {
  title: `Terms of Service — ${brand.name}`,
  description: `Terms governing your ${brand.name} membership, payments, ${brand.tokenName} usage, bookings, and cancellation rights.`,
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--obsidian)',
  color: 'var(--cream)',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 860,
  margin: '0 auto',
  padding: '48px 24px 80px',
};

const h1Style: React.CSSProperties = {
  fontFamily: 'serif',
  fontSize: 40,
  fontWeight: 500,
  color: 'var(--gold)',
  marginBottom: 8,
  lineHeight: 1.2,
};

const h2Style: React.CSSProperties = {
  fontFamily: 'serif',
  fontSize: 24,
  fontWeight: 500,
  color: 'var(--gold)',
  marginTop: 48,
  marginBottom: 16,
};

const h3Style: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--cream)',
  marginTop: 28,
  marginBottom: 10,
};

const pStyle: React.CSSProperties = {
  fontSize: 15,
  color: 'var(--cream)',
  lineHeight: 1.8,
  marginBottom: 16,
};

const muteStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--mute-dk)',
  lineHeight: 1.7,
  marginBottom: 12,
};

const ulStyle: React.CSSProperties = {
  paddingLeft: 24,
  marginBottom: 16,
};

const liStyle: React.CSSProperties = {
  fontSize: 15,
  color: 'var(--cream)',
  lineHeight: 1.8,
  marginBottom: 6,
};

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--line-dk)',
  margin: '40px 0 0',
};

export default function TermsPage() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <PCLogo size={32} href="/" />
          <div style={{ marginTop: 32, marginBottom: 8 }}>
            <Link href="/" style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'none' }}>
              ← Back to Home
            </Link>
          </div>
          <h1 style={h1Style}>Terms of Service</h1>
          <p style={muteStyle}>Last updated: 27 May 2026 · Effective: 27 May 2026</p>
          <p style={pStyle}>
            Please read these Terms of Service ("Terms") carefully before using the {brand.name} platform.
            These Terms form a legally binding contract between you ("Member", "you", or "your") and{' '}
            {brand.legalName} ("{brand.name}", "we", "our", or "us"), a company incorporated in India
            with CIN {brand.cin} and GSTIN {brand.gstin}, with its registered office at{' '}
            {brand.registeredAddress}.
          </p>
          <p style={pStyle}>
            By registering for a {brand.name} membership, accessing the Platform, or making a purchase,
            you agree to be bound by these Terms. If you do not agree to these Terms, you must not use
            the Platform.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 1 */}
        <h2 style={h2Style}>1. Definitions</h2>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>"Platform"</strong> means the {brand.name} website at {brand.domain}, mobile
            applications, and all related services operated by {brand.legalName}.
          </li>
          <li style={liStyle}>
            <strong>"Member"</strong> means any individual who has registered for a {brand.name} membership
            at any tier (Silver, Gold, Platinum, or Obsidian).
          </li>
          <li style={liStyle}>
            <strong>"Deal"</strong> means a time-limited, negotiated offer made available to Members on
            the Platform for goods or services from brand partners.
          </li>
          <li style={liStyle}>
            <strong>"Booking"</strong> means a confirmed order placed by a Member for a Deal, whether
            paid in full, part-paid with {brand.tokenName}s, or reserved pending payment.
          </li>
          <li style={liStyle}>
            <strong>"{brand.tokenName}s" or "{brand.tokenSymbol}"</strong> means the {brand.name} reward
            tokens credited to your wallet on qualifying activity, each worth {brand.currencySymbol}
            {brand.tokenValueInINR} towards future purchases on the Platform.
          </li>
          <li style={liStyle}>
            <strong>"Membership Fee"</strong> means the annual or periodic subscription fee payable to
            access the {brand.name} Platform at the selected tier.
          </li>
          <li style={liStyle}>
            <strong>"Brand Partner"</strong> means any merchant, vendor, or service provider whose products
            or services are made available to Members through the Platform as Deals.
          </li>
        </ul>

        <hr style={dividerStyle} />

        {/* Section 2 */}
        <h2 style={h2Style}>2. Eligibility and Account Registration</h2>

        <h3 style={h3Style}>2.1 Age Requirement</h3>
        <p style={pStyle}>
          You must be at least 18 years of age to register as a Member. By registering, you confirm that
          you are 18 or older. {brand.name} reserves the right to terminate accounts found to belong to
          individuals under 18.
        </p>

        <h3 style={h3Style}>2.2 Accurate Information</h3>
        <p style={pStyle}>
          You agree to provide accurate, complete, and current information during registration and to
          keep your profile information up to date. You are responsible for all activity that occurs
          under your account.
        </p>

        <h3 style={h3Style}>2.3 Account Security</h3>
        <p style={pStyle}>
          Your account is protected by OTP (one-time password) authentication via your registered mobile
          number. You must not share your OTP or session credentials with any third party. Notify us
          immediately at {brand.supportEmail} if you suspect unauthorised access to your account.
        </p>

        <h3 style={h3Style}>2.4 One Account Per Person</h3>
        <p style={pStyle}>
          Each individual may maintain only one {brand.name} Member account. Creating multiple accounts
          to circumvent tier restrictions, accumulate {brand.tokenName}s, or exploit referral programmes
          is prohibited and will result in immediate termination of all associated accounts.
        </p>

        <hr style={dividerStyle} />

        {/* Section 3 */}
        <h2 style={h2Style}>3. Membership Tiers and Terms</h2>

        <h3 style={h3Style}>3.1 Membership Tiers</h3>
        <p style={pStyle}>
          {brand.name} offers four membership tiers — Silver, Gold, Platinum, and Obsidian — each
          providing access to different categories of Deals, {brand.tokenName} earning rates, and
          additional benefits as described on the Platform. Tier-specific benefits and pricing are
          displayed at {brand.url}/membership and are subject to change with 30 days' prior notice to
          existing Members.
        </p>

        <h3 style={h3Style}>3.2 Membership Duration and Renewal</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Memberships are annual unless otherwise stated at the time of purchase.
          </li>
          <li style={liStyle}>
            Memberships do not renew automatically. You will receive a reminder at least 14 days before
            your membership expiry date.
          </li>
          <li style={liStyle}>
            Upon expiry, your access to member-exclusive Deals is suspended until renewal. Your account
            data and {brand.tokenName} balance are retained for 12 months, after which inactive accounts
            may be archived.
          </li>
        </ul>

        <h3 style={h3Style}>3.3 Tier Upgrades and Downgrades</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            You may upgrade your membership tier at any time by paying the difference in annual fee,
            prorated to your remaining membership period.
          </li>
          <li style={liStyle}>
            Tier downgrades take effect at the next renewal date. No refund is issued for the current
            period upon downgrade.
          </li>
        </ul>

        <h3 style={h3Style}>3.4 Tier-Gated Access</h3>
        <p style={pStyle}>
          Certain Deals are accessible only to Members at or above a specified tier. {brand.name}
          reserves the right to modify tier access rules at its discretion. Deals that become
          inaccessible due to tier changes will be honoured for confirmed Bookings made before the
          access change.
        </p>

        <hr style={dividerStyle} />

        {/* Section 4 */}
        <h2 style={h2Style}>4. Payment Terms</h2>

        <h3 style={h3Style}>4.1 Membership Fees</h3>
        <p style={pStyle}>
          All Membership Fees are quoted in Indian Rupees ({brand.currencySymbol}) and are inclusive
          of applicable GST unless explicitly stated otherwise. Membership Fees are non-refundable except
          as provided in Section 7 (Cancellation and Refund Policy).
        </p>

        <h3 style={h3Style}>4.2 Deal Payments</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Deal prices displayed on the Platform are final and inclusive of all applicable taxes unless
            stated otherwise on the individual Deal page.
          </li>
          <li style={liStyle}>
            Payment must be completed at the time of Booking unless a reservation option is explicitly
            offered for that Deal.
          </li>
          <li style={liStyle}>
            {brand.name} accepts payments via Razorpay — including credit/debit cards, UPI, net banking,
            and wallets as supported by Razorpay. Payment method availability may vary.
          </li>
          <li style={liStyle}>
            You may apply {brand.tokenName}s to reduce your payable amount, subject to the redemption
            limits specified in Section 5.
          </li>
        </ul>

        <h3 style={h3Style}>4.3 GST and Invoicing</h3>
        <p style={pStyle}>
          {brand.legalName} (GSTIN: {brand.gstin}) will issue a GST-compliant tax invoice for all
          Membership Fee payments and eligible Deal purchases. Invoices will be emailed to your
          registered email address and are also available in your account under Bookings.
        </p>

        <h3 style={h3Style}>4.4 Failed Payments</h3>
        <p style={pStyle}>
          If a payment fails after initiation, your Booking will not be confirmed and no funds will
          be debited. In the rare event of a payment processing error where funds are debited without
          a confirmed Booking, please contact {brand.supportEmail} and we will initiate a refund within
          5–7 business days.
        </p>

        <h3 style={h3Style}>4.5 Price Accuracy</h3>
        <p style={pStyle}>
          We make every effort to ensure Deal prices are accurate. In the event of a pricing error,
          {brand.name} reserves the right to cancel affected Bookings and issue a full refund. We will
          notify you promptly and give you the option to re-book at the correct price.
        </p>

        <hr style={dividerStyle} />

        {/* Section 5 */}
        <h2 style={h2Style}>5. {brand.tokenName} ({brand.tokenSymbol}) Programme</h2>

        <h3 style={h3Style}>5.1 Earning {brand.tokenName}s</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            {brand.tokenName}s are credited to your wallet upon successful completion of qualifying
            Bookings, as specified on each Deal page.
          </li>
          <li style={liStyle}>
            {brand.tokenName}s may also be earned through referral activity, promotional campaigns, and
            other programmes as announced on the Platform.
          </li>
          <li style={liStyle}>
            {brand.tokenName}s are credited within 48 hours of a Booking being confirmed as delivered
            or fulfilled, not at the time of payment.
          </li>
          <li style={liStyle}>
            Earning rates may differ by membership tier and are displayed on the Platform.
          </li>
        </ul>

        <h3 style={h3Style}>5.2 Redeeming {brand.tokenName}s</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Each {brand.tokenName} is valued at {brand.currencySymbol}{brand.tokenValueInINR} towards
            qualifying Bookings on the Platform.
          </li>
          <li style={liStyle}>
            {brand.tokenName}s may only be redeemed on the Platform and have no cash value. They cannot
            be transferred, sold, or exchanged for currency.
          </li>
          <li style={liStyle}>
            The maximum {brand.tokenName} redemption per Booking is subject to per-Deal limits displayed
            at checkout. By default, {brand.tokenName}s may not offset more than 20% of a Deal's value
            unless otherwise specified.
          </li>
          <li style={liStyle}>
            {brand.tokenName}s cannot be used to pay Membership Fees.
          </li>
        </ul>

        <h3 style={h3Style}>5.3 {brand.tokenName} Expiry</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            {brand.tokenName}s expire 12 months from the date of credit if unused. Tokens earned from
            different transactions may have different expiry dates.
          </li>
          <li style={liStyle}>
            {brand.tokenName}s credited for Bookings that are subsequently cancelled and refunded will
            be reversed from your wallet.
          </li>
          <li style={liStyle}>
            Expired or reversed {brand.tokenName}s cannot be reinstated.
          </li>
        </ul>

        <h3 style={h3Style}>5.4 Programme Modifications</h3>
        <p style={pStyle}>
          {brand.name} reserves the right to modify, suspend, or discontinue the {brand.tokenName}
          programme at any time, with 30 days' prior notice to Members. Upon discontinuation, unredeemed
          tokens will be honoured for 90 days from the notice date.
        </p>

        <hr style={dividerStyle} />

        {/* Section 6 */}
        <h2 style={h2Style}>6. Booking Policies</h2>

        <h3 style={h3Style}>6.1 Booking Confirmation</h3>
        <p style={pStyle}>
          A Booking is confirmed only upon successful payment and issuance of a Booking Confirmation
          reference number. You will receive a confirmation via email and SMS. Until confirmation is
          issued, no contractual obligation to supply the Deal exists on the part of {brand.name} or
          the Brand Partner.
        </p>

        <h3 style={h3Style}>6.2 Deal Availability</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Deals are available while supplies last or until the Deal expiry date, whichever comes first.
          </li>
          <li style={liStyle}>
            {brand.name} does not guarantee Deal availability at the time you attempt to book. A Deal
            listed as available may sell out between the time you view it and the time you complete payment.
          </li>
          <li style={liStyle}>
            If a Deal becomes unavailable after your payment is processed, you will receive a full refund
            including any {brand.tokenName}s used, within 5 business days.
          </li>
        </ul>

        <h3 style={h3Style}>6.3 Fulfilment and Delivery</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Fulfilment timelines are specified on each Deal page. {brand.name} coordinates with Brand
            Partners but is not itself the seller or delivery agent for physical goods unless explicitly stated.
          </li>
          <li style={liStyle}>
            For physical goods, you are responsible for providing an accurate delivery address at the
            time of Booking. {brand.name} and the Brand Partner are not responsible for non-delivery
            due to an incorrect address.
          </li>
          <li style={liStyle}>
            Risk of loss or damage to physical goods passes to you upon delivery to your specified address.
          </li>
        </ul>

        <h3 style={h3Style}>6.4 Concierge Services (Platinum and Obsidian Only)</h3>
        <p style={pStyle}>
          Platinum and Obsidian Members may submit concierge requests for bespoke sourcing, travel, or
          luxury services. Concierge services are provided on a best-efforts basis. Pricing for concierge
          fulfillment is provided as a quote before any commitment is made.
        </p>

        <hr style={dividerStyle} />

        {/* Section 7 */}
        <h2 style={h2Style}>7. Cancellation and Refund Policy</h2>

        <h3 style={h3Style}>7.1 Membership Fee Refunds</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Membership Fees are refundable within 7 days of purchase if no Deals have been booked under
            that membership. To request a refund, email {brand.supportEmail} with subject "Membership
            Refund Request".
          </li>
          <li style={liStyle}>
            After 7 days, or if any Booking has been made, Membership Fees are non-refundable.
          </li>
          <li style={liStyle}>
            If {brand.name} terminates your account due to our fault, you will receive a pro-rated
            refund for the unused portion of your membership period.
          </li>
        </ul>

        <h3 style={h3Style}>7.2 Deal Booking Cancellations</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Each Deal specifies its own cancellation window on the Deal page. Where no window is specified,
            cancellations are accepted within 24 hours of Booking confirmation, provided fulfilment has
            not commenced.
          </li>
          <li style={liStyle}>
            Cancellations made within the permitted window will receive a full refund of the cash amount
            paid, credited back to the original payment method within 5–7 business days.
          </li>
          <li style={liStyle}>
            {brand.tokenName}s used in a cancelled Booking will be credited back to your wallet within
            24 hours of cancellation approval.
          </li>
          <li style={liStyle}>
            Cancellations after the permitted window, or for non-cancellable Deals (e.g., bespoke orders,
            event tickets, perishables), will not be eligible for a refund unless required by applicable
            Indian consumer protection law.
          </li>
        </ul>

        <h3 style={h3Style}>7.3 {brand.name}-Initiated Cancellations</h3>
        <p style={pStyle}>
          In the event that {brand.name} or a Brand Partner must cancel a confirmed Booking (e.g., due
          to stock unavailability, pricing error, or force majeure), you will receive:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>A full refund of all amounts paid (cash and {brand.tokenName}s); and</li>
          <li style={liStyle}>A courtesy {brand.tokenName} credit of 200 {brand.tokenSymbol} for the inconvenience, where the cancellation is due to {brand.name}'s or the Brand Partner's fault.</li>
        </ul>

        <h3 style={h3Style}>7.4 Consumer Rights</h3>
        <p style={pStyle}>
          Nothing in this Cancellation and Refund Policy limits your rights under the Consumer Protection
          Act, 2019 or any other applicable Indian consumer protection legislation.
        </p>

        <hr style={dividerStyle} />

        {/* Section 8 */}
        <h2 style={h2Style}>8. Referral Programme</h2>

        <h3 style={h3Style}>8.1 How Referrals Work</h3>
        <p style={pStyle}>
          Active Members may refer new individuals to {brand.name} using their unique referral code.
          When a referred individual completes a paid membership registration using your referral code,
          you earn a referral commission in {brand.tokenName}s, as specified in the Referral Programme
          terms on the Platform.
        </p>

        <h3 style={h3Style}>8.2 Commission Terms</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Referral commissions are credited to your wallet within 7 days of your referee's membership
            payment clearing.
          </li>
          <li style={liStyle}>
            Commissions are reversed if the referee cancels their membership within the 7-day refund window.
          </li>
          <li style={liStyle}>
            Self-referrals and referrals of existing Members are not eligible for commission.
          </li>
          <li style={liStyle}>
            {brand.name} may operate a multi-level referral programme as described on the Referral page.
            Commission rates and trail levels are defined on the Platform and may be updated with 14 days'
            prior notice.
          </li>
        </ul>

        <h3 style={h3Style}>8.3 Referral Programme Integrity</h3>
        <p style={pStyle}>
          Any attempt to manipulate the referral programme — including creating fake accounts, using bots,
          or coordinated self-referral schemes — will result in immediate account termination and
          forfeiture of all accrued commissions and {brand.tokenName}s.
        </p>

        <hr style={dividerStyle} />

        {/* Section 9 */}
        <h2 style={h2Style}>9. Prohibited Conduct</h2>
        <p style={pStyle}>
          When using the Platform, you agree not to:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Violate any applicable local, state, national, or international law or regulation, including
            those of India.
          </li>
          <li style={liStyle}>
            Create multiple accounts, use another person's account, or misrepresent your identity or
            membership tier.
          </li>
          <li style={liStyle}>
            Attempt to reverse-engineer, scrape, crawl, or extract data from the Platform in bulk by
            automated means without prior written consent.
          </li>
          <li style={liStyle}>
            Circumvent, disable, or interfere with security features, rate limiting, or access controls
            on the Platform.
          </li>
          <li style={liStyle}>
            Resell, sublicense, or transfer access to {brand.name} Deals or your membership benefits
            to third parties for commercial gain.
          </li>
          <li style={liStyle}>
            Use the Platform to transmit spam, phishing attempts, malware, or other malicious content.
          </li>
          <li style={liStyle}>
            Engage in any conduct that could damage the reputation of {brand.name} or its Brand Partners.
          </li>
          <li style={liStyle}>
            Attempt to obtain {brand.tokenName}s fraudulently or exploit bugs in {brand.tokenName}
            crediting logic.
          </li>
          <li style={liStyle}>
            Use the concierge service for requests that are illegal, harmful, or in violation of these Terms.
          </li>
        </ul>
        <p style={pStyle}>
          Violation of these prohibitions may result in immediate account suspension or termination,
          forfeiture of unredeemed {brand.tokenName}s, and, where appropriate, referral to law
          enforcement authorities.
        </p>

        <hr style={dividerStyle} />

        {/* Section 10 */}
        <h2 style={h2Style}>10. Intellectual Property</h2>
        <p style={pStyle}>
          All content on the Platform — including the {brand.name} name, logo, deal descriptions,
          photographs, software, and design — is the intellectual property of {brand.legalName} or
          its licensors and is protected under the Copyright Act, 1957 and the Trade Marks Act, 1999
          of India.
        </p>
        <p style={pStyle}>
          You are granted a limited, non-exclusive, non-transferable licence to access and use the
          Platform solely for your personal, non-commercial use as a Member. You may not reproduce,
          distribute, modify, or create derivative works from any Platform content without prior
          written consent from {brand.name}.
        </p>

        <hr style={dividerStyle} />

        {/* Section 11 */}
        <h2 style={h2Style}>11. Disclaimer of Warranties</h2>
        <p style={pStyle}>
          The Platform is provided on an "as is" and "as available" basis. {brand.legalName} makes no
          warranties, express or implied, including but not limited to implied warranties of
          merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p style={pStyle}>
          {brand.name} does not warrant that:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>The Platform will be uninterrupted, error-free, or free of viruses or other harmful components;</li>
          <li style={liStyle}>The information or content on the Platform is always accurate or complete;</li>
          <li style={liStyle}>Deals will always be available or that Brand Partners will always fulfill orders to your satisfaction.</li>
        </ul>
        <p style={pStyle}>
          {brand.name} acts as an intermediary between Members and Brand Partners for most Deals.
          The Brand Partner is the seller of record for product and service fulfillment.
        </p>

        <hr style={dividerStyle} />

        {/* Section 12 */}
        <h2 style={h2Style}>12. Limitation of Liability</h2>
        <p style={pStyle}>
          To the maximum extent permitted by applicable Indian law, {brand.legalName} and its directors,
          officers, employees, agents, and affiliates shall not be liable for any:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>Indirect, incidental, special, consequential, or punitive damages;</li>
          <li style={liStyle}>Loss of profits, revenue, data, goodwill, or business opportunities;</li>
          <li style={liStyle}>Damages arising from your reliance on any information or content on the Platform;</li>
          <li style={liStyle}>Service interruptions caused by factors beyond our reasonable control.</li>
        </ul>
        <p style={pStyle}>
          Our aggregate liability to you in connection with these Terms or the Platform — whether in
          contract, tort (including negligence), or otherwise — shall not exceed the total Membership
          Fee paid by you in the 12 months preceding the event giving rise to the claim.
        </p>
        <p style={pStyle}>
          Nothing in these Terms excludes liability for death or personal injury caused by negligence,
          fraud, or any other liability that cannot be excluded under Indian law.
        </p>

        <hr style={dividerStyle} />

        {/* Section 13 */}
        <h2 style={h2Style}>13. Indemnification</h2>
        <p style={pStyle}>
          You agree to indemnify, defend, and hold harmless {brand.legalName}, its directors, officers,
          employees, and agents from and against any claims, liabilities, damages, losses, and expenses
          (including reasonable legal fees) arising from:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>Your use of or access to the Platform;</li>
          <li style={liStyle}>Your violation of these Terms;</li>
          <li style={liStyle}>Your violation of any third-party rights, including intellectual property rights; or</li>
          <li style={liStyle}>Any fraudulent, harmful, or illegal activity by you in connection with the Platform.</li>
        </ul>

        <hr style={dividerStyle} />

        {/* Section 14 */}
        <h2 style={h2Style}>14. Termination</h2>

        <h3 style={h3Style}>14.1 Termination by You</h3>
        <p style={pStyle}>
          You may close your account at any time by navigating to Settings → Account Actions → Delete
          Account, or by emailing {brand.supportEmail}. Account closure is subject to the refund terms
          in Section 7. Unredeemed {brand.tokenName}s are forfeited upon account closure, except where
          the closure is initiated within the 7-day membership refund window.
        </p>

        <h3 style={h3Style}>14.2 Termination by {brand.name}</h3>
        <p style={pStyle}>
          {brand.name} may suspend or terminate your account immediately if you:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>Violate any provision of these Terms;</li>
          <li style={liStyle}>Engage in fraudulent, abusive, or illegal activity;</li>
          <li style={liStyle}>Fail to pay any amounts due; or</li>
          <li style={liStyle}>Otherwise act in a manner that {brand.name} reasonably determines is harmful to the Platform, other Members, or Brand Partners.</li>
        </ul>
        <p style={pStyle}>
          In cases of termination for cause, no refund of Membership Fees will be issued and accrued
          {brand.tokenName}s are forfeited. {brand.name} will provide written notice of termination
          except where immediate action is required to prevent harm.
        </p>

        <hr style={dividerStyle} />

        {/* Section 15 */}
        <h2 style={h2Style}>15. Governing Law and Dispute Resolution</h2>

        <h3 style={h3Style}>15.1 Governing Law</h3>
        <p style={pStyle}>
          These Terms are governed by and construed in accordance with the laws of the Republic of
          India, without regard to its conflict of law principles.
        </p>

        <h3 style={h3Style}>15.2 Jurisdiction</h3>
        <p style={pStyle}>
          Any disputes arising from or relating to these Terms or your use of the Platform shall be
          subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.
          You consent to personal jurisdiction in such courts and waive any objection to such venue.
        </p>

        <h3 style={h3Style}>15.3 Consumer Disputes</h3>
        <p style={pStyle}>
          Nothing in this section limits your right to file a complaint before an appropriate Consumer
          Disputes Redressal Commission under the Consumer Protection Act, 2019, or to seek relief
          through any other forum provided by applicable Indian law.
        </p>

        <h3 style={h3Style}>15.4 Informal Resolution</h3>
        <p style={pStyle}>
          Before initiating any formal legal proceedings, you agree to attempt to resolve the dispute
          informally by contacting {brand.supportEmail} and providing a written description of the
          issue. We will try to resolve the matter within 30 days.
        </p>

        <hr style={dividerStyle} />

        {/* Section 16 */}
        <h2 style={h2Style}>16. Modifications to These Terms</h2>
        <p style={pStyle}>
          {brand.name} reserves the right to update or modify these Terms at any time. When we make
          material changes, we will notify active Members via email and/or an in-app notice at least
          7 days before the changes take effect. The "Last updated" date at the top of this page
          reflects the most recent revision.
        </p>
        <p style={pStyle}>
          Continued use of the Platform after the effective date constitutes your acceptance of the
          revised Terms. If you do not agree to the revised Terms, you must stop using the Platform
          and may close your account as described in Section 14.
        </p>

        <hr style={dividerStyle} />

        {/* Section 17 */}
        <h2 style={h2Style}>17. Miscellaneous</h2>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy and any
            other policies referenced herein, constitute the entire agreement between you and{' '}
            {brand.legalName} regarding the Platform.
          </li>
          <li style={liStyle}>
            <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable,
            the remaining provisions will continue in full force and effect.
          </li>
          <li style={liStyle}>
            <strong>Waiver:</strong> Failure by {brand.name} to enforce any provision of these Terms
            shall not constitute a waiver of that provision or any other.
          </li>
          <li style={liStyle}>
            <strong>Assignment:</strong> You may not assign your rights or obligations under these Terms
            without our prior written consent. {brand.name} may assign these Terms in connection with
            a merger, acquisition, or sale of assets.
          </li>
          <li style={liStyle}>
            <strong>Force Majeure:</strong> {brand.name} shall not be liable for delays or failures in
            performance caused by events beyond our reasonable control, including acts of God, government
            actions, internet disruptions, or civil disturbances.
          </li>
          <li style={liStyle}>
            <strong>Language:</strong> These Terms are executed in English. In the event of any
            inconsistency between an English version and a translated version, the English version prevails.
          </li>
        </ul>

        <hr style={dividerStyle} />

        {/* Section 18 */}
        <h2 style={h2Style}>18. Contact Us</h2>
        <p style={pStyle}>
          For questions about these Terms of Service, please contact us:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}><strong>Email:</strong> {brand.supportEmail}</li>
          <li style={liStyle}><strong>Legal Entity:</strong> {brand.legalName}</li>
          <li style={liStyle}><strong>CIN:</strong> {brand.cin}</li>
          <li style={liStyle}><strong>GSTIN:</strong> {brand.gstin}</li>
          <li style={liStyle}><strong>Registered Address:</strong> {brand.registeredAddress}</li>
          <li style={liStyle}><strong>Response Time:</strong> We aim to respond to all legal inquiries within 72 hours.</li>
        </ul>

        {/* Footer nav */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--line-dk)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/refund" style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'none' }}>Refund Policy</Link>
          <Link href="/" style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'none' }}>Home</Link>
          <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>© 2026 {brand.legalName}</span>
        </div>
      </div>
    </div>
  );
}

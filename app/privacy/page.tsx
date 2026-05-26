import Link from 'next/link';
import { PCLogo } from '@/components/ui/PCLogo';

export const metadata = {
  title: 'Privacy Policy — PlutusClub',
  description: 'How PlutusClub collects, uses, and protects your personal data under the DPDP Act 2023.',
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

export default function PrivacyPage() {
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
          <h1 style={h1Style}>Privacy Policy</h1>
          <p style={muteStyle}>Last updated: 25 May 2026 · Effective: 25 May 2026</p>
          <p style={pStyle}>
            PlutusClub Technology Pvt. Ltd. ("PlutusClub", "we", "our", or "us") is committed to protecting
            your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use the PlutusClub platform — including our website, mobile application,
            and related services (collectively, the "Platform"). This policy complies with the Digital Personal
            Data Protection Act, 2023 ("DPDP Act 2023") of India and applicable Apple App Store and Google
            Play Store requirements.
          </p>
          <p style={pStyle}>
            By accessing or using the Platform, you agree to the collection and use of your personal data
            as described in this Privacy Policy. If you do not agree, please discontinue use of the Platform.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 1 */}
        <h2 style={h2Style}>1. Data Fiduciary</h2>
        <p style={pStyle}>
          As defined under the DPDP Act 2023, the Data Fiduciary responsible for processing your personal
          data is:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}><strong>Entity:</strong> PlutusClub Technology Pvt. Ltd.</li>
          <li style={liStyle}><strong>Registered Address:</strong> [Registered Office Address], Maharashtra, India</li>
          <li style={liStyle}><strong>CIN:</strong> [Company Identification Number]</li>
          <li style={liStyle}><strong>Contact Email:</strong> privacy@plutusclub.in</li>
        </ul>

        <hr style={dividerStyle} />

        {/* Section 2 */}
        <h2 style={h2Style}>2. What Personal Data We Collect</h2>
        <p style={pStyle}>
          We collect only the personal data necessary to provide our services. The categories of data we
          collect include:
        </p>

        <h3 style={h3Style}>2.1 Identity &amp; Contact Data</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Full name</li>
          <li style={liStyle}>Email address</li>
          <li style={liStyle}>Mobile phone number (used for OTP-based authentication via SMS)</li>
          <li style={liStyle}>Residential or delivery address</li>
          <li style={liStyle}>Date of birth (to verify you are 18 or older)</li>
        </ul>

        <h3 style={h3Style}>2.2 Membership &amp; Account Data</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Membership tier (Silver, Gold, Platinum, Obsidian)</li>
          <li style={liStyle}>Member ID and referral code</li>
          <li style={liStyle}>Token balances and transaction history</li>
          <li style={liStyle}>Booking and order history</li>
          <li style={liStyle}>Referral relationships</li>
        </ul>

        <h3 style={h3Style}>2.3 Payment Data</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Payment method type (card, UPI, net banking)</li>
          <li style={liStyle}>Transaction IDs and Razorpay payment references</li>
          <li style={liStyle}>GST Invoice details</li>
          <li style={liStyle}>
            <em>Note: We do not store full card numbers or CVV. Card data is handled directly by Razorpay
            (PCI-DSS Level 1 certified).</em>
          </li>
        </ul>

        <h3 style={h3Style}>2.4 Device &amp; Technical Data</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>IP address</li>
          <li style={liStyle}>Browser type and version</li>
          <li style={liStyle}>Device type, operating system, and app version</li>
          <li style={liStyle}>Device identifiers (for mobile app)</li>
          <li style={liStyle}>Session tokens and authentication tokens</li>
        </ul>

        <h3 style={h3Style}>2.5 Location Data</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Approximate location derived from IP address (for region-specific deals)</li>
          <li style={liStyle}>Delivery address (city and pincode for logistical purposes)</li>
          <li style={liStyle}>
            <em>We do not collect precise GPS location data without explicit consent.</em>
          </li>
        </ul>

        <h3 style={h3Style}>2.6 Usage &amp; Analytics Data</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Pages and features accessed</li>
          <li style={liStyle}>Deals viewed, bookmarked, and purchased</li>
          <li style={liStyle}>Session duration and frequency of use</li>
          <li style={liStyle}>Search queries and filter preferences</li>
          <li style={liStyle}>Crash reports and performance diagnostics</li>
        </ul>

        <h3 style={h3Style}>2.7 Communications Data</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Messages sent to our support team</li>
          <li style={liStyle}>Feedback and survey responses</li>
          <li style={liStyle}>Notification preferences</li>
        </ul>

        <hr style={dividerStyle} />

        {/* Section 3 */}
        <h2 style={h2Style}>3. Why We Collect Your Data (Purposes)</h2>

        <h3 style={h3Style}>3.1 Service Delivery</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Creating and managing your PlutusClub membership account</li>
          <li style={liStyle}>Authenticating your identity via OTP (one-time password) sent via SMS</li>
          <li style={liStyle}>Processing membership fees and deal payments through Razorpay</li>
          <li style={liStyle}>Fulfilling bookings and coordinating delivery with brand partners</li>
          <li style={liStyle}>Calculating, crediting, and tracking PC Tokens</li>
          <li style={liStyle}>Managing referral relationships and commissions</li>
        </ul>

        <h3 style={h3Style}>3.2 Communications</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Sending transactional notifications (booking confirmations, payment receipts)</li>
          <li style={liStyle}>Sending OTP via SMS for login and sensitive operations</li>
          <li style={liStyle}>Sending promotional communications (with your consent, which you may withdraw)</li>
          <li style={liStyle}>Responding to support queries and grievances</li>
        </ul>

        <h3 style={h3Style}>3.3 Security &amp; Fraud Prevention</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Detecting and preventing fraudulent transactions and multiple account abuse</li>
          <li style={liStyle}>Monitoring for suspicious activity and bot access</li>
          <li style={liStyle}>Verifying age eligibility (18+)</li>
          <li style={liStyle}>Complying with Know Your Customer (KYC) obligations where applicable</li>
        </ul>

        <h3 style={h3Style}>3.4 Legal Compliance</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Generating GST-compliant invoices as required under the GST Act</li>
          <li style={liStyle}>Maintaining financial records as required by Indian law</li>
          <li style={liStyle}>Responding to lawful requests from government authorities</li>
          <li style={liStyle}>Complying with the DPDP Act 2023 obligations</li>
        </ul>

        <h3 style={h3Style}>3.5 Analytics &amp; Improvement</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>Understanding how members use the Platform to improve features</li>
          <li style={liStyle}>Measuring deal performance and member engagement</li>
          <li style={liStyle}>Personalising deal recommendations based on your tier and history</li>
        </ul>

        <hr style={dividerStyle} />

        {/* Section 4 */}
        <h2 style={h2Style}>4. Legal Basis for Processing (DPDP Act 2023)</h2>
        <p style={pStyle}>
          Under the DPDP Act 2023, we process your personal data on the following grounds:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Consent:</strong> Where you have provided explicit, free, specific, informed, and
            unambiguous consent — for example, for marketing communications, analytics cookies, and
            location-based personalisation.
          </li>
          <li style={liStyle}>
            <strong>Contractual Necessity:</strong> Processing necessary to perform the membership contract
            you enter into with us — including account creation, payment processing, and order fulfillment.
          </li>
          <li style={liStyle}>
            <strong>Legitimate Use (Legal Obligation):</strong> Processing required to comply with
            applicable Indian laws, including GST, income tax, and RBI regulations.
          </li>
          <li style={liStyle}>
            <strong>Legitimate Interests:</strong> Processing for fraud prevention, platform security,
            and service improvement — where our interests do not override your fundamental rights.
          </li>
        </ul>
        <p style={pStyle}>
          You may withdraw your consent at any time. Withdrawal of consent will not affect the lawfulness
          of processing based on consent before its withdrawal, and certain processing may continue on
          other legal grounds.
        </p>

        <hr style={dividerStyle} />

        {/* Section 5 */}
        <h2 style={h2Style}>5. Data Retention Periods</h2>
        <p style={pStyle}>
          We retain your personal data only as long as necessary for the purposes described in this policy,
          or as required by applicable law:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Membership &amp; Account Data:</strong> 7 years from the date of account closure or
            membership expiry, as required under the GST Act, 2017 (which mandates retention of financial
            records for 6 years, with one additional year for dispute resolution).
          </li>
          <li style={liStyle}>
            <strong>Payment &amp; Transaction Data:</strong> 5 years from the date of transaction, as
            required under RBI guidelines and the Prevention of Money Laundering Act (PMLA).
          </li>
          <li style={liStyle}>
            <strong>Analytics Data:</strong> 2 years from collection, after which data is anonymised
            or deleted.
          </li>
          <li style={liStyle}>
            <strong>Communication Logs (Support):</strong> 3 years from the last interaction.
          </li>
          <li style={liStyle}>
            <strong>OTP Logs:</strong> 90 days for security audit purposes.
          </li>
          <li style={liStyle}>
            <strong>Deleted Accounts:</strong> Upon account deletion, personally identifiable information
            is removed within 30 days. Anonymised transactional records required for legal compliance
            are retained for the statutory periods above.
          </li>
        </ul>

        <hr style={dividerStyle} />

        {/* Section 6 */}
        <h2 style={h2Style}>6. Third-Party Data Processors</h2>
        <p style={pStyle}>
          We share your personal data only with trusted third parties who process data on our behalf,
          under written data processing agreements. Current processors include:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Supabase Inc.</strong> — Database and authentication infrastructure. Your account data,
            membership records, and transaction history are stored on Supabase's cloud servers. Data is
            stored in compliance with our retention policies.
          </li>
          <li style={liStyle}>
            <strong>Razorpay Software Pvt. Ltd.</strong> — Payment processing. Razorpay handles all
            payment card data and is PCI-DSS Level 1 certified. Razorpay's privacy policy is available
            at razorpay.com/privacy.
          </li>
          <li style={liStyle}>
            <strong>Twilio Inc.</strong> — SMS delivery for OTP authentication and transactional
            notifications. Phone numbers are shared with Twilio solely to deliver messages.
          </li>
          <li style={liStyle}>
            <strong>Google Fonts</strong> — We use Cormorant Garamond from Google Fonts. Google may
            receive your IP address when fonts are loaded. You may use a browser extension to block this.
          </li>
        </ul>
        <p style={pStyle}>
          We do not sell, rent, or trade your personal data to any third party for their own marketing
          purposes. We do not use ad networks or advertising cookies.
        </p>

        <hr style={dividerStyle} />

        {/* Section 7 */}
        <h2 style={h2Style}>7. Your Rights Under the DPDP Act 2023</h2>
        <p style={pStyle}>
          As a Data Principal under the DPDP Act 2023, you have the following rights:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Right to Access:</strong> You may request a summary of the personal data we hold about
            you and the purposes for which it is being processed.
          </li>
          <li style={liStyle}>
            <strong>Right to Correction:</strong> You may request correction of inaccurate or incomplete
            personal data. You can update most profile data directly in the PlutusClub app under Settings.
          </li>
          <li style={liStyle}>
            <strong>Right to Erasure:</strong> You may request deletion of your personal data. We will
            comply within 30 days, subject to retention obligations under applicable law. See Section 10
            for account deletion instructions.
          </li>
          <li style={liStyle}>
            <strong>Right to Data Portability:</strong> You may request a machine-readable copy of your
            personal data that you have provided to us. Use the "Export My Data" feature in Settings or
            contact privacy@plutusclub.in.
          </li>
          <li style={liStyle}>
            <strong>Right to Withdraw Consent:</strong> You may withdraw consent for non-essential data
            processing at any time. Withdrawal does not affect prior processing.
          </li>
          <li style={liStyle}>
            <strong>Right to Grievance Redressal:</strong> You may raise concerns with our Grievance
            Officer (see Section 9). You also have the right to raise complaints with the Data Protection
            Board of India, once established under the DPDP Act 2023.
          </li>
          <li style={liStyle}>
            <strong>Right to Nominate:</strong> You may nominate an individual to exercise your rights
            on your behalf in the event of your death or incapacity.
          </li>
        </ul>
        <p style={pStyle}>
          To exercise any of these rights, email privacy@plutusclub.in with the subject line "Data Rights
          Request". We will respond within 72 hours and fulfill eligible requests within 30 days.
        </p>

        <hr style={dividerStyle} />

        {/* Section 8 */}
        <h2 style={h2Style}>8. Cookies and Tracking Technologies</h2>
        <p style={pStyle}>
          We use cookies and similar technologies to operate and improve the Platform. By default, we use
          only essential cookies. You may control optional cookies via the cookie consent banner.
        </p>
        <h3 style={h3Style}>Types of Cookies We Use</h3>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Essential Cookies:</strong> Required for the Platform to function — session authentication,
            security tokens, and load balancing. These cannot be disabled.
          </li>
          <li style={liStyle}>
            <strong>Preference Cookies:</strong> Remember your settings, notification preferences, and
            display choices.
          </li>
          <li style={liStyle}>
            <strong>Analytics Cookies:</strong> Help us understand how the Platform is used. We use
            anonymised, aggregate analytics. Requires your consent.
          </li>
        </ul>
        <p style={pStyle}>
          We do not use third-party advertising cookies or cross-site tracking technologies. You may
          withdraw cookie consent at any time by clearing your browser's local storage or contacting us.
        </p>

        <hr style={dividerStyle} />

        {/* Section 9 */}
        <h2 style={h2Style}>9. Grievance Officer</h2>
        <p style={pStyle}>
          In accordance with the DPDP Act 2023 and IT Act, 2000, we have appointed a Grievance Officer
          to address data-related concerns:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}><strong>Name:</strong> [Grievance Officer Name]</li>
          <li style={liStyle}><strong>Designation:</strong> Data Protection Officer</li>
          <li style={liStyle}><strong>Email:</strong> privacy@plutusclub.in</li>
          <li style={liStyle}><strong>Address:</strong> PlutusClub Technology Pvt. Ltd., [Registered Office], Maharashtra, India</li>
          <li style={liStyle}><strong>Response time:</strong> Within 72 hours of receipt of complaint</li>
        </ul>
        <p style={pStyle}>
          Complaints will be addressed within 30 days. If you are not satisfied with our response, you
          may escalate to the Data Protection Board of India once constituted under the DPDP Act 2023.
        </p>

        <hr style={dividerStyle} />

        {/* Section 10 */}
        <h2 style={h2Style}>10. How to Delete Your Account</h2>
        <p style={pStyle}>
          You have the right to delete your PlutusClub account and personal data. To do so:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>In-App:</strong> Go to Settings → Account Actions → Delete Account. You will be asked
            to type "DELETE" to confirm. This initiates immediate deactivation.
          </li>
          <li style={liStyle}>
            <strong>By Email:</strong> Send a request to privacy@plutusclub.in with subject line
            "Account Deletion Request" from your registered email address.
          </li>
        </ul>
        <p style={pStyle}>
          Upon deletion request: your account is deactivated immediately; personally identifiable data is
          anonymised or removed within 30 days; financial transaction records required by law are retained
          in anonymised form for the statutory periods specified in Section 5.
        </p>
        <p style={pStyle}>
          Active memberships that are deleted will be subject to the refund policy at plutusclub.in/refund.
        </p>

        <hr style={dividerStyle} />

        {/* Section 11 */}
        <h2 style={h2Style}>11. Children's Privacy</h2>
        <p style={pStyle}>
          The PlutusClub Platform is not intended for individuals under the age of 18. We do not knowingly
          collect personal data from anyone under 18 years of age. Age verification is required during the
          registration process. If we become aware that we have inadvertently collected data from a minor,
          we will delete it immediately.
        </p>
        <p style={pStyle}>
          If you are a parent or guardian and believe your child has registered on our Platform, please
          contact us at privacy@plutusclub.in and we will take immediate corrective action.
        </p>

        <hr style={dividerStyle} />

        {/* Section 12 */}
        <h2 style={h2Style}>12. International Data Transfers</h2>
        <p style={pStyle}>
          Some of our third-party processors (including Supabase and Twilio) may process your data on
          servers located outside India. Where such transfers occur, we ensure that:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>The transfer is to a country designated as having adequate data protection by the Government of India under the DPDP Act 2023;</li>
          <li style={liStyle}>Appropriate contractual safeguards (Standard Contractual Clauses) are in place with the recipient processor; or</li>
          <li style={liStyle}>The transfer is covered by other lawful mechanisms under the DPDP Act 2023.</li>
        </ul>
        <p style={pStyle}>
          We will update this section as the Government of India notifies permitted jurisdictions under
          the DPDP Act 2023.
        </p>

        <hr style={dividerStyle} />

        {/* Section 13 */}
        <h2 style={h2Style}>13. Security Measures</h2>
        <p style={pStyle}>
          We implement industry-standard technical and organisational security measures to protect your
          personal data, including:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using TLS 1.2 or higher (SSL/HTTPS).</li>
          <li style={liStyle}><strong>Encryption at Rest:</strong> Sensitive data stored in our database is encrypted at rest using AES-256.</li>
          <li style={liStyle}><strong>PCI-DSS Compliance:</strong> Payment processing is handled by Razorpay, which is PCI-DSS Level 1 certified. We do not store raw card data.</li>
          <li style={liStyle}><strong>OTP Authentication:</strong> Account access is protected by one-time passwords delivered via SMS, with rate limiting and brute-force protection.</li>
          <li style={liStyle}><strong>Access Controls:</strong> Internal access to personal data is restricted on a need-to-know basis, with audit logging.</li>
          <li style={liStyle}><strong>Regular Security Audits:</strong> We conduct periodic security assessments of our infrastructure and application code.</li>
        </ul>
        <p style={pStyle}>
          Despite these measures, no system is completely secure. In the event of a data breach that
          poses risk to your rights, we will notify you and the Data Protection Board as required by the
          DPDP Act 2023 within the prescribed timeframe.
        </p>

        <hr style={dividerStyle} />

        {/* Section 14 */}
        <h2 style={h2Style}>14. Changes to This Privacy Policy</h2>
        <p style={pStyle}>
          We may update this Privacy Policy from time to time to reflect changes in our practices, legal
          requirements, or services. When we make material changes, we will notify you via email and/or
          an in-app notice at least 7 days before the changes take effect. The "Last updated" date at the
          top of this policy reflects the most recent revision.
        </p>
        <p style={pStyle}>
          Continued use of the Platform after the effective date of any changes constitutes your acceptance
          of the revised policy.
        </p>

        <hr style={dividerStyle} />

        {/* Section 15 */}
        <h2 style={h2Style}>15. Contact Us</h2>
        <p style={pStyle}>
          For any questions, concerns, or requests related to this Privacy Policy or your personal data,
          please contact us:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}><strong>Email:</strong> privacy@plutusclub.in</li>
          <li style={liStyle}><strong>Response Time:</strong> We aim to respond to all inquiries within 72 hours.</li>
          <li style={liStyle}><strong>Postal Address:</strong> PlutusClub Technology Pvt. Ltd., [Registered Office], Maharashtra, India</li>
        </ul>

        {/* Footer nav */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--line-dk)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/refund" style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'none' }}>Refund Policy</Link>
          <Link href="/" style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'none' }}>Home</Link>
          <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>© 2026 PlutusClub Technology Pvt. Ltd.</span>
        </div>
      </div>
    </div>
  );
}

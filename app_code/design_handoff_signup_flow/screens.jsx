// PlutusClub — iOS signup screens. Obsidian + champagne gold.
// Private buying club for India's middle class.

const PC = {
  obsidian: '#0A0A12',
  ink: '#15151F',
  ink2: '#1F1F2B',
  gold: '#C9A961',
  goldHi: '#E2C77A',
  goldDeep: '#8E7333',
  cream: '#F6F2E8',
  paper: '#FBF8F1',
  mute: '#7A7787',
  muteDk: '#9A95A7',
  line: '#E8E2D2',
  lineDk: 'rgba(255,255,255,0.08)',
};

const SERIF = '"Cormorant Garamond", "Playfair Display", "Times New Roman", Georgia, serif';
const SANS = '-apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

// Inject Google fonts once
if (typeof document !== 'undefined' && !document.getElementById('pc-fonts')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap';
  link.id = 'pc-fonts';
  document.head.appendChild(link);
}

// — Plutus monogram logo (P with serif flourish) —
function PCLogo({ size = 28, color = PC.gold, dark = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: SERIF }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18.5" stroke={color} strokeWidth="1.2"/>
        <circle cx="20" cy="20" r="14" stroke={color} strokeWidth="0.5" strokeOpacity="0.5"/>
        <text x="20" y="27" textAnchor="middle" fontFamily={SERIF} fontSize="20" fontWeight="600" fill={color} letterSpacing="-1">P</text>
      </svg>
      <span style={{
        fontSize: size * 0.72, fontWeight: 500, color: dark ? PC.cream : PC.obsidian,
        letterSpacing: 2.8, textTransform: 'uppercase', fontFamily: SANS,
      }}>PlutusClub</span>
    </div>
  );
}

// — Primary CTA —
function PrimaryBtn({ children, dark = false, gold = false, style = {} }) {
  const bg = gold ? PC.gold : (dark ? PC.cream : PC.obsidian);
  const fg = gold ? PC.obsidian : (dark ? PC.obsidian : PC.cream);
  return (
    <div style={{
      height: 56, borderRadius: 4, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: fg, fontWeight: 500, fontSize: 14, letterSpacing: 2,
      fontFamily: SANS, textTransform: 'uppercase',
      ...style,
    }}>{children}</div>
  );
}

function GhostBtn({ children, dark = false, style = {} }) {
  return (
    <div style={{
      height: 56, borderRadius: 4,
      background: 'transparent',
      border: `1px solid ${dark ? PC.lineDk : PC.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: dark ? PC.cream : PC.obsidian,
      fontSize: 14, fontWeight: 500, letterSpacing: 2,
      fontFamily: SANS, textTransform: 'uppercase',
      ...style,
    }}>{children}</div>
  );
}

// — Progress —
function Progress({ step, total = 6, dark = false }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 2,
          width: i === step ? 20 : 10,
          background: i <= step ? PC.gold : (dark ? PC.lineDk : PC.line),
          transition: 'all .2s',
        }} />
      ))}
    </div>
  );
}

// — Back chip —
function BackChip({ dark = false }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 18,
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,18,0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="10" height="16" viewBox="0 0 10 16">
        <path d="M8 1L2 8l6 7" stroke={dark ? PC.cream : PC.obsidian} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function TopBar({ step, total, dark }) {
  return (
    <div style={{
      padding: '0 24px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <BackChip dark={dark}/>
      <Progress step={step} total={total} dark={dark}/>
      <div style={{ width: 36 }}/>
    </div>
  );
}

function ScreenShell({ children, bg = PC.paper, padTop = 64, dark = false }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: bg,
      paddingTop: padTop, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      fontFamily: SANS, color: dark ? PC.cream : PC.obsidian,
    }}>
      {children}
    </div>
  );
}

// Eyebrow label (uppercase tracked)
function Eyebrow({ children, color, style = {} }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: 2.5,
      textTransform: 'uppercase', color: color || PC.gold,
      fontFamily: SANS, ...style,
    }}>{children}</div>
  );
}

// Display headline (serif)
function Display({ children, dark = false, style = {} }) {
  return (
    <h1 style={{
      fontFamily: SERIF, fontWeight: 500,
      fontSize: 38, lineHeight: 1.08, letterSpacing: -0.5,
      margin: 0, color: dark ? PC.cream : PC.obsidian,
      ...style,
    }}>{children}</h1>
  );
}

// — Small star ornament (Rolex coronet substitute) —
function Ornament({ size = 8, color = PC.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
      <path d="M4 0 L4.7 3.3 L8 4 L4.7 4.7 L4 8 L3.3 4.7 L0 4 L3.3 3.3 Z" fill={color}/>
    </svg>
  );
}

// — Gradient gold hairline (with optional centered ornament) —
function Hairline({ dark = false, ornament = false, style = {} }) {
  const c = dark ? PC.gold : PC.goldDeep;
  if (ornament) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${c}88, ${c})` }}/>
        <Ornament color={c} size={7}/>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${c}, ${c}88, transparent)` }}/>
      </div>
    );
  }
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, ${c}55 20%, ${c}55 80%, transparent)`,
      ...style,
    }}/>
  );
}

// — Step heading block: eyebrow + serif title + hairline rule —
function StepHead({ step, title, kicker, dark = false }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Eyebrow color={dark ? PC.gold : PC.goldDeep}>Step {step}</Eyebrow>
        <div style={{ flex: 1, height: 1, background: dark ? PC.lineDk : `${PC.goldDeep}33` }}/>
        <Eyebrow color={dark ? PC.muteDk : PC.mute} style={{ fontSize: 9 }}>{kicker}</Eyebrow>
      </div>
      <Display dark={dark} style={{ marginTop: 12 }}>{title}</Display>
    </div>
  );
}

// — Section divider (subtle, between groups of UI) —
function SectionDivider({ label, dark = false, style = {} }) {
  const c = dark ? PC.muteDk : PC.mute;
  const line = dark ? PC.lineDk : `${PC.goldDeep}22`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }}>
      <div style={{ flex: 1, height: 1, background: line }}/>
      <div style={{
        fontSize: 9, letterSpacing: 2.5, color: c,
        textTransform: 'uppercase', fontWeight: 500,
      }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: line }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. WELCOME — manifesto hero, dark
// ─────────────────────────────────────────────────────────────
function ScreenWelcome() {
  return (
    <ScreenShell bg={PC.obsidian} padTop={0} dark>
      {/* Hero */}
      <div style={{
        position: 'relative', flex: 1,
        background: PC.obsidian, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* faint gold radial */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 480, height: 480, borderRadius: '50%',
          background: `radial-gradient(circle, ${PC.gold}22 0%, transparent 60%)`,
        }}/>
        {/* faint frame border */}
        <div style={{
          position: 'absolute', top: 96, left: 24, right: 24, bottom: 24,
          border: `1px solid ${PC.lineDk}`,
          pointerEvents: 'none',
        }}/>

        {/* logo */}
        <div style={{ padding: '76px 24px 0', textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ display: 'block', margin: '0 auto' }}>
            <circle cx="20" cy="20" r="18.5" stroke={PC.gold} strokeWidth="1"/>
            <circle cx="20" cy="20" r="14" stroke={PC.gold} strokeWidth="0.5" strokeOpacity="0.4"/>
            <text x="20" y="27" textAnchor="middle" fontFamily={SERIF} fontSize="20" fontWeight="600" fill={PC.gold} letterSpacing="-1">P</text>
          </svg>
          <div style={{
            marginTop: 14, fontSize: 11, letterSpacing: 4,
            color: PC.gold, textTransform: 'uppercase',
          }}>PlutusClub</div>
          <div style={{
            marginTop: 2, fontSize: 9, letterSpacing: 3,
            color: PC.muteDk, textTransform: 'uppercase',
          }}>Est. MMXXVI · Private Membership</div>
        </div>

        {/* Manifesto headline */}
        <div style={{ padding: '64px 36px 0', textAlign: 'center', position: 'relative' }}>
          <Eyebrow color={PC.gold}>— The Founding Manifesto —</Eyebrow>
          <h1 style={{
            marginTop: 18, fontFamily: SERIF, fontWeight: 400,
            fontSize: 34, lineHeight: 1.15, letterSpacing: -0.3, color: PC.cream,
          }}>
            The price you pay<br/>is not the price<br/>you <em style={{ color: PC.gold, fontStyle: 'italic' }}>deserve.</em>
          </h1>
          <p style={{
            marginTop: 22, fontSize: 13, lineHeight: 1.65,
            color: PC.muteDk, fontFamily: SANS, letterSpacing: 0.1,
            maxWidth: 280, margin: '22px auto 0',
          }}>
            A private buying club. The institutional pricing once reserved for armies, corporations, and the well-connected — now open to you.
          </p>
        </div>

        {/* Stats strip — Rolex dial treatment */}
        <div style={{
          marginTop: 'auto', marginBottom: 24, padding: '0 24px',
        }}>
          {/* top hairline w/ centre ornament */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 18,
          }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${PC.gold}88, ${PC.gold})` }}/>
            <svg width="8" height="8" viewBox="0 0 8 8">
              <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill={PC.gold}/>
            </svg>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${PC.gold}, ${PC.gold}88, transparent)` }}/>
          </div>

          <div style={{
            display: 'flex', alignItems: 'stretch',
          }}>
            {[
              ['60',     'Categories'],
              ['10\u2009K+', 'Private Members'],
              ['18–40%', 'Avg. Savings'],
            ].map(([n, l], i) => (
              <React.Fragment key={l}>
                {i > 0 && (
                  <div style={{
                    width: 1,
                    background: `linear-gradient(180deg, transparent, ${PC.gold}66 30%, ${PC.gold}66 70%, transparent)`,
                  }}/>
                )}
                <div style={{ flex: 1, textAlign: 'center', padding: '4px 4px 2px' }}>
                  <div style={{
                    fontFamily: SERIF,
                    fontSize: 32, lineHeight: 1,
                    color: PC.gold,
                    fontWeight: 500,
                    letterSpacing: -0.5,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    fontFeatureSettings: '"lnum", "tnum"',
                  }}>{n}</div>
                  <div style={{
                    marginTop: 9,
                    fontSize: 8, letterSpacing: 2.2,
                    color: PC.cream,
                    textTransform: 'uppercase', fontWeight: 500,
                    fontFamily: SANS,
                  }}>{l}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* bottom hairline */}
          <div style={{
            marginTop: 14, height: 1,
            background: `linear-gradient(90deg, transparent, ${PC.gold}55 20%, ${PC.gold}55 80%, transparent)`,
          }}/>

          {/* swiss-made-style imprint */}
          <div style={{
            marginTop: 10, textAlign: 'center',
            fontSize: 7.5, letterSpacing: 3, color: PC.muteDk,
            textTransform: 'uppercase', fontFamily: SANS,
          }}>
            Crafted in India · Member Owned
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 24px 36px', background: PC.obsidian, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryBtn gold>Request Membership</PrimaryBtn>
        <div style={{
          textAlign: 'center', padding: '12px 0', fontSize: 12,
          color: PC.muteDk, letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          Already a member? <span style={{ color: PC.gold, fontWeight: 600 }}>Sign in</span>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. PHONE
// ─────────────────────────────────────────────────────────────
function ScreenPhone() {
  return (
    <ScreenShell bg={PC.paper}>
      <TopBar step={0} total={6}/>
      <div style={{ padding: '24px 24px 0', flex: 1 }}>
        <StepHead step="01" kicker="Identity" title={<>What's your<br/>number?</>}/>
        <p style={{ marginTop: 16, fontSize: 14, color: PC.mute, lineHeight: 1.55, maxWidth: 300 }}>
          We'll send a one-time code to confirm. Your number is never shared with brands.
        </p>

        <div style={{ marginTop: 34, display: 'flex', gap: 10 }}>
          <div style={{
            height: 60, borderRadius: 4, border: `1px solid ${PC.line}`,
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, background: '#fff',
          }}>
            <div style={{ width: 22, height: 14, borderRadius: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, background: '#FF9933' }}/>
              <div style={{ flex: 1, background: '#fff', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 4, height: 4, borderRadius: 2, background: '#000088' }}/>
                </div>
              </div>
              <div style={{ flex: 1, background: '#138808' }}/>
            </div>
            <span style={{ fontSize: 15, fontWeight: 500 }}>+91</span>
            <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke={PC.mute} strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>
          </div>
          <div style={{
            flex: 1, height: 60, borderRadius: 4,
            border: `1px solid ${PC.obsidian}`,
            display: 'flex', alignItems: 'center', padding: '0 16px', background: '#fff',
          }}>
            <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}>98765 4321</span>
            <div style={{ width: 1.5, height: 22, background: PC.gold, marginLeft: 2 }}/>
          </div>
        </div>

        {/* fine print box */}
        <div style={{
          marginTop: 26, padding: '14px 16px',
          background: PC.paper, border: `1px solid ${PC.line}`, borderRadius: 4,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11, background: PC.obsidian,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
          }}>
            <svg width="10" height="12" viewBox="0 0 10 12"><path d="M5 1L2 4v3c0 2 1.5 3.5 3 4 1.5-.5 3-2 3-4V4L5 1z" stroke={PC.gold} strokeWidth="1.2" fill="none" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontSize: 12, color: PC.mute, lineHeight: 1.55 }}>
            <strong style={{ color: PC.obsidian, fontWeight: 600 }}>The member is never the product.</strong> Your data is never sold to brands.
          </div>
        </div>

        <p style={{ marginTop: 22, fontSize: 11, color: PC.mute, lineHeight: 1.6, letterSpacing: 0.1 }}>
          By continuing you agree to the PlutusClub <span style={{ color: PC.obsidian, fontWeight: 600, textDecoration: 'underline', textDecorationColor: PC.line }}>Member Charter</span> and <span style={{ color: PC.obsidian, fontWeight: 600, textDecoration: 'underline', textDecorationColor: PC.line }}>Privacy Policy</span>.
        </p>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <PrimaryBtn>Send Code</PrimaryBtn>
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. OTP
// ─────────────────────────────────────────────────────────────
function ScreenOTP() {
  const digits = ['8', '4', '2', '1', '', ''];
  return (
    <ScreenShell bg={PC.paper}>
      <TopBar step={1} total={6}/>
      <div style={{ padding: '24px 24px 0', flex: 1 }}>
        <StepHead step="02" kicker="Verification" title={<>Enter the<br/>six-digit code.</>}/>
        <p style={{ marginTop: 16, fontSize: 14, color: PC.mute, lineHeight: 1.55 }}>
          Sent via SMS to <span style={{ color: PC.obsidian, fontWeight: 600 }}>+91 98765 43210</span>. <span style={{ color: PC.goldDeep, fontWeight: 600, borderBottom: `1px solid ${PC.gold}` }}>Change</span>
        </p>

        <div style={{ marginTop: 34, display: 'flex', gap: 6, justifyContent: 'space-between' }}>
          {digits.map((d, i) => (
            <div key={i} style={{
              width: 44, height: 64, borderRadius: 4,
              border: `1px solid ${d ? PC.obsidian : (i === 4 ? PC.obsidian : PC.line)}`,
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: SERIF,
              fontSize: 30, fontWeight: 500, color: PC.obsidian,
              position: 'relative',
              boxShadow: i === 4 ? `inset 0 0 0 1px ${PC.obsidian}` : 'none',
              fontVariantNumeric: 'lining-nums tabular-nums',
            }}>
              {d}
              {i === 4 && <div style={{ width: 1.5, height: 28, background: PC.gold }}/>}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 32, padding: 16, background: '#fff',
          border: `1px solid ${PC.line}`, borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: PC.mute, textTransform: 'uppercase' }}>Resend in</div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: PC.obsidian, marginTop: 2 }}>0 : 24</div>
          </div>
          <div style={{ fontSize: 12, color: PC.mute, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Didn't receive it? <span style={{ color: PC.goldDeep, fontWeight: 600 }}>Call instead</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <PrimaryBtn style={{ opacity: 0.4 }}>Verify</PrimaryBtn>
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. PROFILE
// ─────────────────────────────────────────────────────────────
function ScreenName() {
  return (
    <ScreenShell bg={PC.paper}>
      <TopBar step={2} total={6}/>
      <div style={{ padding: '24px 24px 0', flex: 1 }}>
        <StepHead step="03" kicker="The Member" title={<>Tell us<br/>about you.</>}/>
        <p style={{ marginTop: 16, fontSize: 14, color: PC.mute, lineHeight: 1.55 }}>
          Your name appears on every invoice, ID-verification, and member certificate.
        </p>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Full Name" value="Aarav Mehta" filled/>
          <Field label="Email" value="aarav.mehta@" filled focus caret/>
          <Field label="City" value="Mumbai · MH" filled/>
        </div>

        <div style={{
          marginTop: 22, padding: '14px 16px', background: PC.obsidian,
          color: PC.cream, borderRadius: 4,
          display: 'flex', alignItems: 'center', gap: 14,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* gold corner */}
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ position: 'absolute', top: -1, left: -1 }}>
            <path d="M0 10 L0 0 L10 0" stroke={PC.gold} strokeWidth="1" fill="none"/>
          </svg>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ position: 'absolute', bottom: -1, right: -1, transform: 'rotate(180deg)' }}>
            <path d="M0 10 L0 0 L10 0" stroke={PC.gold} strokeWidth="1" fill="none"/>
          </svg>
          <div style={{
            width: 38, height: 38, borderRadius: 19, border: `1px solid ${PC.gold}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ornament size={12}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: 2.5, color: PC.gold, textTransform: 'uppercase', fontWeight: 600 }}>Founding Cohort</div>
            <div style={{ fontSize: 13, marginTop: 4, color: PC.cream, letterSpacing: 0.1 }}>
              Member <span style={{ fontFamily: SERIF, fontSize: 17, color: PC.gold, fontVariantNumeric: 'tabular-nums lining-nums' }}>#01,247</span> of <span style={{ fontFamily: SERIF, fontSize: 17, color: PC.cream, fontVariantNumeric: 'tabular-nums lining-nums' }}>10,000</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 24px 24px' }}>
        <PrimaryBtn>Continue</PrimaryBtn>
      </div>
    </ScreenShell>
  );
}

function Field({ label, value, filled, focus, caret }) {
  return (
    <div style={{
      height: 64, borderRadius: 4,
      border: `1px solid ${focus ? PC.obsidian : PC.line}`,
      background: '#fff',
      padding: '10px 16px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
      position: 'relative',
    }}>
      {/* gold accent bar on focus */}
      {focus && (
        <div style={{
          position: 'absolute', left: 0, top: 12, bottom: 12, width: 2,
          background: PC.gold, borderRadius: 0,
        }}/>
      )}
      <div style={{
        fontSize: 9, color: focus ? PC.goldDeep : PC.mute,
        fontWeight: 600, letterSpacing: 2.4, textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <span style={{
          fontSize: 16, fontWeight: 500,
          color: filled ? PC.obsidian : PC.mute,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}>{value}</span>
        {caret && <div style={{ width: 1.5, height: 18, background: PC.gold, marginLeft: 1 }}/>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. TIER PICKER — the KEY screen
// ─────────────────────────────────────────────────────────────
function ScreenTier() {
  const tiers = [
    { name: 'Silver',   price: '₹999',    sub: 'per year', cats: '12 categories',  selected: false, dark: false, accent: '#A8A8B0' },
    { name: 'Gold',     price: '₹3,999',  sub: 'per year', cats: '28 categories',  selected: false, dark: false, accent: PC.gold },
    { name: 'Platinum', price: '₹9,999',  sub: 'per year', cats: '46 categories',  selected: true,  dark: true,  accent: '#E8E4D8' },
    { name: 'Obsidian', price: '₹24,999', sub: 'per year', cats: 'All 60 + concierge', selected: false, dark: false, accent: PC.obsidian, isObsidian: true },
  ];
  return (
    <ScreenShell bg={PC.paper}>
      <TopBar step={3} total={6}/>
      <div style={{ padding: '12px 24px 0', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <StepHead step="04" kicker="The Tier" title={<>Choose your<br/>standing.</>}/>
        <p style={{ marginTop: 14, fontSize: 13, color: PC.mute, lineHeight: 1.5 }}>
          Each tier unlocks deeper categories and bigger savings. Upgrade anytime.
        </p>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflow: 'auto' }}>
          {tiers.map(t => <TierRow key={t.name} {...t}/>)}
        </div>
      </div>
      <div style={{ padding: '14px 24px 24px' }}>
        <PrimaryBtn>Continue with Platinum</PrimaryBtn>
      </div>
    </ScreenShell>
  );
}

function TierRow({ name, price, sub, cats, selected, isObsidian, accent }) {
  const dark = selected;
  return (
    <div style={{
      borderRadius: 4, padding: '16px 16px',
      background: dark ? PC.obsidian : '#fff',
      border: `1px solid ${dark ? PC.obsidian : PC.line}`,
      color: dark ? PC.cream : PC.obsidian,
      display: 'flex', alignItems: 'center', gap: 14,
      position: 'relative', overflow: 'visible',
    }}>
      {/* Recommended ribbon (top-right corner) */}
      {name === 'Platinum' && (
        <div style={{
          position: 'absolute', top: -7, right: 14,
          fontSize: 8.5, fontWeight: 600, letterSpacing: 2,
          color: PC.obsidian, background: PC.gold,
          padding: '2px 8px', borderRadius: 1, textTransform: 'uppercase',
          boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
        }}>Recommended</div>
      )}

      {/* tier accent stripe */}
      <div style={{
        width: 3, height: 42, background: accent, borderRadius: 1.5, flexShrink: 0,
      }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: SERIF, fontSize: 22, fontWeight: 500,
          color: dark ? PC.cream : PC.obsidian, letterSpacing: -0.3, lineHeight: 1,
        }}>{name}</div>
        <div style={{
          fontSize: 10, color: dark ? PC.muteDk : PC.mute,
          marginTop: 5, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 500,
        }}>{cats}</div>
      </div>
      <div style={{ textAlign: 'right', marginRight: 6 }}>
        <div style={{
          fontFamily: SERIF, fontSize: 22, fontWeight: 500,
          color: dark ? PC.gold : PC.obsidian,
          fontVariantNumeric: 'tabular-nums lining-nums', lineHeight: 1,
        }}>{price}</div>
        <div style={{
          fontSize: 9, color: dark ? PC.muteDk : PC.mute,
          letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 5, fontWeight: 500,
        }}>{sub}</div>
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 10,
        border: `1.5px solid ${dark ? PC.gold : PC.line}`,
        background: dark ? PC.gold : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {dark && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke={PC.obsidian} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. CATEGORY INTERESTS
// ─────────────────────────────────────────────────────────────
function ScreenCategories() {
  const cats = [
    { label: 'Automobiles', icon: 'car', selected: true, freq: 'Once a decade' },
    { label: 'Health Insurance', icon: 'shield', selected: true, freq: 'Every year' },
    { label: 'International Holidays', icon: 'plane', selected: true, freq: 'Quarterly' },
    { label: 'Real Estate', icon: 'home', selected: false, freq: 'Once a lifetime' },
    { label: 'Investments · SIPs', icon: 'chart', selected: true, freq: 'Every month' },
    { label: 'Premium Electronics', icon: 'device', selected: false, freq: 'Every 2 yrs' },
    { label: 'Luxury Watches', icon: 'watch', selected: false, freq: 'Once a decade' },
    { label: 'Education Abroad', icon: 'cap', selected: false, freq: 'Once' },
  ];
  return (
    <ScreenShell bg={PC.paper}>
      <TopBar step={4} total={6}/>
      <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <StepHead step="05" kicker="Your Categories" title={<>What will you<br/>buy this year?</>}/>
        <p style={{ marginTop: 14, fontSize: 13, color: PC.mute, lineHeight: 1.5 }}>
          We'll prioritise deals in these categories. <span style={{ color: PC.obsidian, fontWeight: 600 }}>4 of 8 selected</span>
        </p>

        <div style={{
          marginTop: 18, display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, overflow: 'auto',
        }}>
          {cats.map(c => <CategoryChip key={c.label} {...c}/>)}
        </div>
      </div>
      <div style={{ padding: '14px 24px 24px' }}>
        <PrimaryBtn>Continue · 4 selected</PrimaryBtn>
      </div>
    </ScreenShell>
  );
}

function CategoryChip({ label, icon, selected, freq }) {
  const icons = {
    car: <path d="M3 14l1.5-5h11L17 14M5 14h10M5 14v3M15 14v3M6 11h8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    shield: <path d="M10 2L3 5v5c0 4 3 7 7 8 4-1 7-4 7-8V5l-7-3z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>,
    plane: <path d="M10 2l-2 7-6 2 6 1 2 6 2-6 6-1-6-2-2-7z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>,
    home: <path d="M3 9l7-6 7 6v8H3V9z M8 17v-5h4v5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>,
    chart: <path d="M3 16l5-6 4 3 5-8 M3 16h14" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    device: <path d="M5 3h10v14H5V3z M9 14h2" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>,
    watch: <path d="M10 5v5l3 2 M14 4l-1-2H7L6 4 M14 16l-1 2H7l-1-2 M10 16a6 6 0 100-12 6 6 0 000 12z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    cap: <path d="M2 7l8-3 8 3-8 3-8-3z M5 9v4c0 1.5 2 3 5 3s5-1.5 5-3V9 M17 8v5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>,
  };
  return (
    <div style={{
      padding: '14px 12px',
      background: selected ? PC.obsidian : '#fff',
      color: selected ? PC.cream : PC.obsidian,
      border: `1px solid ${selected ? PC.obsidian : PC.line}`,
      borderRadius: 4,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 96,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <svg width="22" height="22" viewBox="0 0 20 20" style={{ color: selected ? PC.gold : PC.obsidian }}>
          {icons[icon]}
        </svg>
        <div style={{
          width: 16, height: 16, borderRadius: 8,
          border: `1.5px solid ${selected ? PC.gold : PC.line}`,
          background: selected ? PC.gold : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && <svg width="8" height="6" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke={PC.obsidian} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>{label}</div>
        <div style={{ fontSize: 9.5, color: selected ? PC.muteDk : PC.mute, marginTop: 3, letterSpacing: 0.8, textTransform: 'uppercase' }}>{freq}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. PAYMENT — membership fee
// ─────────────────────────────────────────────────────────────
function ScreenPayment() {
  return (
    <ScreenShell bg={PC.paper}>
      <TopBar step={5} total={6}/>
      <div style={{ padding: '12px 24px 0', flex: 1 }}>
        <StepHead step="06" kicker="Activation" title={<>Activate your<br/>Platinum tier.</>}/>
        <p style={{ marginTop: 14, fontSize: 13, color: PC.mute, lineHeight: 1.5 }}>
          One-time charge today. Auto-renews on May 25, 2027. Cancel anytime.
        </p>

        {/* Receipt with corner flourishes */}
        <div style={{
          marginTop: 22, padding: '20px 20px 18px',
          background: '#fff', border: `1px solid ${PC.goldDeep}44`, borderRadius: 4,
          position: 'relative',
        }}>
          {/* corner brackets */}
          {[[0,0,0],[0,1,90],[1,0,270],[1,1,180]].map(([x,y,r],i)=>(
            <svg key={i} width="10" height="10" viewBox="0 0 10 10" style={{
              position:'absolute', [y?'bottom':'top']:-1, [x?'right':'left']:-1,
              transform:`rotate(${r}deg)`,
            }}><path d="M0 10 L0 0 L10 0" stroke={PC.goldDeep} strokeWidth="1" fill="none"/></svg>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14 }}>
            <div>
              <Eyebrow color={PC.goldDeep}>PlutusClub · Platinum</Eyebrow>
              <div style={{ fontFamily: SERIF, fontSize: 19, marginTop: 5, letterSpacing: -0.2 }}>Annual Membership</div>
              <div style={{ fontSize: 10, color: PC.mute, marginTop: 4, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                25 May 2026 → 25 May 2027
              </div>
            </div>
            <div style={{
              width: 46, height: 46, borderRadius: 23,
              border: `1px solid ${PC.gold}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: SERIF, fontSize: 24, color: PC.gold, fontWeight: 500 }}>P</span>
            </div>
          </div>

          <Hairline style={{ marginBottom: 4 }}/>

          <ReceiptRow label="Membership · 1 year" value="₹9,999"/>
          <ReceiptRow label="Founding member credit" value="− ₹1,000" gold/>
          <ReceiptRow label="GST (18%)" value="₹1,620"/>

          <Hairline ornament style={{ margin: '14px 0 10px' }}/>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 9.5, letterSpacing: 2.4, color: PC.mute, textTransform: 'uppercase', fontWeight: 500 }}>Total today</div>
              <div style={{ fontSize: 10, color: PC.mute, marginTop: 2, letterSpacing: 0.3 }}>Incl. all taxes</div>
            </div>
            <div style={{
              fontFamily: SERIF, fontSize: 30, fontWeight: 500,
              color: PC.obsidian, letterSpacing: -0.5,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}>₹10,619</div>
          </div>
        </div>

        {/* Section divider */}
        <SectionDivider label="Choose payment method" style={{ margin: '20px 0 12px' }}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PayRow icon="upi" title="UPI · GPay" sub="aarav@okhdfcbank" selected/>
          <PayRow icon="card" title="Credit / Debit card" sub="Visa, Mastercard, Amex, Rupay"/>
          <PayRow icon="nb" title="Net Banking" sub="42 banks supported"/>
        </div>
      </div>

      <div style={{ padding: '16px 24px 24px' }}>
        <PrimaryBtn>Pay ₹10,619</PrimaryBtn>
      </div>
    </ScreenShell>
  );
}

function ReceiptRow({ label, value, gold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      paddingTop: 9, fontSize: 13,
    }}>
      <span style={{
        color: gold ? PC.goldDeep : PC.mute,
        fontWeight: gold ? 600 : 400,
      }}>{label}</span>
      <span style={{
        color: gold ? PC.goldDeep : PC.obsidian,
        fontVariantNumeric: 'tabular-nums lining-nums',
        fontWeight: 500, fontFamily: SERIF, fontSize: 15,
        letterSpacing: -0.1,
      }}>{value}</span>
    </div>
  );
}

function PayRow({ icon, title, sub, selected }) {
  return (
    <div style={{
      borderRadius: 4, padding: '12px 14px',
      background: '#fff',
      border: `1px solid ${selected ? PC.obsidian : PC.line}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 4,
        background: selected ? PC.obsidian : PC.paper,
        color: selected ? PC.gold : PC.obsidian,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, letterSpacing: 1,
      }}>
        {icon === 'upi' && 'UPI'}
        {icon === 'card' && (
          <svg width="20" height="14" viewBox="0 0 20 14"><rect x="0.5" y="0.5" width="19" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><rect x="0" y="3" width="20" height="2" fill="currentColor"/></svg>
        )}
        {icon === 'nb' && 'NB'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.1 }}>{title}</div>
        <div style={{ fontSize: 11, color: PC.mute, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: 9,
        border: `1.5px solid ${selected ? PC.obsidian : PC.line}`,
        background: selected ? PC.obsidian : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: 3, background: PC.gold }}/>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. ALL SET — Member Certificate
// ─────────────────────────────────────────────────────────────
function ScreenDone() {
  return (
    <ScreenShell bg={PC.obsidian} padTop={0} dark>
      <div style={{
        position: 'relative', flex: 1, padding: '88px 24px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', overflow: 'hidden',
      }}>
        {/* gold radial */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 460, height: 460, borderRadius: '50%',
          background: `radial-gradient(circle, ${PC.gold}33 0%, transparent 65%)`,
        }}/>

        <Eyebrow color={PC.gold}>— Welcome, Member —</Eyebrow>

        {/* Certificate */}
        <div style={{
          marginTop: 28, width: 280, padding: '30px 26px 24px',
          border: `1px solid ${PC.gold}`,
          background: `linear-gradient(180deg, ${PC.ink} 0%, ${PC.ink2} 100%)`,
          position: 'relative',
        }}>
          {/* corner flourishes */}
          {[[0,0,0],[0,1,90],[1,0,270],[1,1,180]].map(([x,y,r],i)=>(
            <svg key={i} width="14" height="14" viewBox="0 0 14 14" style={{
              position:'absolute', [y?'bottom':'top']:-1, [x?'right':'left']:-1,
              transform:`rotate(${r}deg)`,
            }}><path d="M0 14 L0 0 L14 0" stroke={PC.gold} strokeWidth="1.4" fill="none"/></svg>
          ))}

          <svg width="44" height="44" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto', display: 'block' }}>
            <circle cx="20" cy="20" r="18.5" stroke={PC.gold} strokeWidth="1"/>
            <text x="20" y="27.5" textAnchor="middle" fontFamily={SERIF} fontSize="22" fontWeight="500" fill={PC.gold}>P</text>
          </svg>
          <div style={{ marginTop: 10, fontSize: 9, letterSpacing: 3.5, color: PC.muteDk, textTransform: 'uppercase' }}>
            Certificate of Membership
          </div>
          <div style={{
            marginTop: 16, fontFamily: SERIF, fontSize: 24, color: PC.cream, fontWeight: 400, lineHeight: 1.1,
          }}>
            Aarav Mehta
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: PC.muteDk, letterSpacing: 1.2 }}>
            is hereby admitted as a
          </div>
          <div style={{
            marginTop: 8, fontFamily: SERIF, fontSize: 26, color: PC.gold, fontWeight: 500, letterSpacing: -0.4,
          }}>
            Platinum Member
          </div>

          <div style={{
            marginTop: 18, paddingTop: 14, borderTop: `1px solid ${PC.lineDk}`,
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: PC.muteDk,
          }}>
            <div>
              <div>Member No.</div>
              <div style={{ color: PC.gold, fontFamily: SERIF, fontSize: 13, letterSpacing: 0.5, marginTop: 2 }}>PC · 01247</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Admitted</div>
              <div style={{ color: PC.gold, fontFamily: SERIF, fontSize: 13, letterSpacing: 0.5, marginTop: 2 }}>25 · V · 2026</div>
            </div>
          </div>
        </div>

        <p style={{
          marginTop: 26, fontSize: 13, lineHeight: 1.6, color: PC.muteDk,
          maxWidth: 300, position: 'relative',
        }}>
          <strong style={{ color: PC.cream }}>Your first deal is ready.</strong> The Maruti Grand Vitara fleet price — ₹1,12,000 below sticker — closes in 4 days.
        </p>
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        <PrimaryBtn gold>Enter the Club</PrimaryBtn>
        <GhostBtn dark>View My Certificate</GhostBtn>
      </div>
    </ScreenShell>
  );
}

Object.assign(window, {
  PC, PCLogo,
  ScreenWelcome, ScreenPhone, ScreenOTP, ScreenName,
  ScreenTier, ScreenCategories, ScreenPayment, ScreenDone,
});

# Handoff: PlutusClub Signup Flow — iOS & Android

## Overview
This is the onboarding/signup flow for **PlutusClub**, a private membership buying club for India's middle class (manifesto: *"The price you pay is not the price you deserve."*). The flow takes a new user from a marketing welcome screen through phone verification, profile setup, tier selection, category interests, payment, and finally an "admitted" certificate screen.

**Eight screens total**, delivered for **both iOS (390 × 844 pt)** and **Android (412 × 892 dp)**. The visual design is identical across platforms — only the device chrome (status bar, navigation, back gesture) differs.

---

## About the Design Files
The files in this bundle are **design references created in HTML/React (Babel-transpiled JSX)** — they are prototypes showing intended look and behavior, **not production code to copy directly**.

Your job is to **recreate these designs in your target codebase's environment**:
- If shipping iOS native → SwiftUI, using your existing design system
- If hybrid → React Native / Flutter, mapping these styles to your component library
- If web → React/Vue, using your established patterns

The HTML/JSX in here uses a custom `<IOSDevice>` device frame and a `<DesignCanvas>` showcase wrapper that are **scaffolding only** — strip them and recreate the screen content using your platform's native primitives.

---

## Fidelity
**High-fidelity (hifi)** — pixel-perfect mockups with final colors, typography, spacing, copy, and gold-foil accents. Recreate these exactly. Every gold hairline, every serif numeral, every tracked label is intentional.

---

## Brand & Aesthetic Direction
PlutusClub's brand DNA is **luxury watch / private members' club**, not fintech app. Reference points: Rolex catalog, AMEX Centurion, Soho House membership card. Specifically:
- **Restraint over decoration.** Hairline rules, not borders. Tracked uppercase labels, not chips.
- **Gold is a finish, not a fill.** Use it for hairlines, monograms, and serif numerals — never as a button background except on the welcome CTA.
- **Cormorant Garamond** (serif) is for headlines and numerals. **SF / system sans** is for labels and body.
- **Tabular lining numerals everywhere** money or counts appear: `font-variant-numeric: tabular-nums lining-nums`.

---

## Design Tokens

### Colors
```
obsidian      #0A0A12   // primary dark surface
ink           #15151F   // slightly elevated dark
ink2          #1F1F2B   // top of inner dark gradients
gold          #C9A961   // primary accent (foil)
goldHi        #E2C77A   // gold highlight
goldDeep      #8E7333   // gold on light surfaces (sufficient contrast)
cream         #F6F2E8   // text on dark
paper         #FBF8F1   // primary light surface (warm off-white)
mute          #7A7787   // body text on light
muteDk        #9A95A7   // body text on dark
line          #E8E2D2   // hairline on light
lineDk        rgba(255,255,255,0.08)  // hairline on dark
```

### Typography
- **Serif:** `Cormorant Garamond` (Google Fonts), weights 400/500/600/700. Used for: headlines, member name on certificate, numerals (prices, member numbers, dates), tier names.
- **Sans:** `-apple-system, "SF Pro Text", "SF Pro Display", system-ui` (iOS native). Used for: body text, labels, buttons, tracked uppercase eyebrows.

#### Type scale
| Token | Usage | Size / Weight / Line-height / Tracking |
|---|---|---|
| Display | Screen H1 (serif) | 38px / 500 / 1.08 / -0.5 |
| Manifesto | Welcome hero (serif) | 34px / 400 / 1.15 / -0.3 |
| Tier Name | Tier card heading (serif) | 22px / 500 / 1.0 / -0.3 |
| Price (large) | Receipt total (serif) | 30px / 500 / 1.0 / -0.5 |
| Price (row) | Tier price, receipt rows (serif) | 22px / 500 / 1.0 / tabular |
| Stat number | Welcome dial stats (serif) | 32px / 500 / 1.0 / -0.5 / tabular |
| Body | Paragraph (sans) | 13–14px / 400 / 1.5 |
| Eyebrow | Section labels (sans, ALL CAPS) | 10px / 600 / tracking 2.5 |
| Mini-label | Field labels, footnotes (sans, ALL CAPS) | 9–9.5px / 600 / tracking 2.0–2.4 |
| Engraving | Certificate fine print (sans, ALL CAPS) | 9px / 500 / tracking 3.5 |

### Spacing
Screens use **24px horizontal padding** as the base gutter. Vertical rhythm:
- 12–14px between an eyebrow and its title
- 14–16px between title and body copy
- 22–28px between body and primary form/content
- 18–22px between content groups
- 24–36px bottom padding above CTA

### Radii
- **4px** — buttons, cards, form fields, receipts. Most surfaces.
- **9999px (pill)** — only the country-code chevron arrow on phone field is sharp; the back chip is a 36×36 circle.
- **Circles** — 19–23px radius for monogram badges, 10px for radio dots.

### Hairlines & Ornaments
- **Gradient hairline**: 1px gold (`#C9A961` on dark, `#8E7333` on light), fading to transparent at edges. Used everywhere a flat divider would feel cheap.
- **Star ornament**: 7–8px four-point gold star. Centered on hairlines that introduce key info (welcome stats, receipt total).
- **Corner brackets**: L-shaped 1px gold strokes at each corner of cards that should feel "certified" — the founding-cohort badge, the receipt, the member certificate.

### Buttons
- **PrimaryBtn (default)**: 56px tall, 4px radius, `#0A0A12` bg, `#F6F2E8` text, 14px/600/tracking 2, UPPERCASE.
- **PrimaryBtn (gold)**: same dimensions, `#C9A961` bg, `#0A0A12` text. Used on welcome and final "Enter the Club" CTA.
- **PrimaryBtn (dark surface)**: `#F6F2E8` bg, `#0A0A12` text. Used on dark backgrounds.
- **GhostBtn**: transparent bg, 1px line border (matches surface), same text.
- Buttons in a disabled state: reduce opacity to 0.4.

---

## Screens

### 1. Welcome (`ScreenWelcome`)
**Purpose:** Manifesto-style first impression. Sells the brand before the form.

**Layout (top → bottom, all centered):**
1. Status bar (auto, from device frame)
2. **76px top padding** → 40×40 P-monogram logo (gold ring + serif P)
3. **14px** → wordmark `PLUTUSCLUB` (11px tracked 4)
4. **2px** → tagline `EST. MMXXVI · PRIVATE MEMBERSHIP` (9px tracked 3, muteDk)
5. **64px** → eyebrow `— THE FOUNDING MANIFESTO —` (gold)
6. **18px** → headline serif 34px: *"The price you pay / is not the price / you deserve."* — "deserve." is italic + gold
7. **22px** → body 13px muteDk, max-width 280, centered: *"A private buying club. The institutional pricing once reserved for armies, corporations, and the well-connected — now open to you."*
8. **margin-top: auto** → **Rolex dial stats strip** (3 columns, gradient gold hairlines top + bottom, centered star ornament on top hairline):
   - `60` Categories
   - `10 K+` Private Members
   - `18–40%` Avg. Savings
   Numbers serif 32px gold, labels 8px tracked 2.2 cream. Vertical hairline gradient dividers between columns.
9. Below stats: `CRAFTED IN INDIA · MEMBER OWNED` (7.5px tracked 3, muteDk)
10. Bottom block (obsidian bg, 24px padding): gold-fill CTA `REQUEST MEMBERSHIP`, secondary text `Already a member? Sign in`.

**Decorative:** subtle radial gold gradient (`#C9A96122` → transparent) from top center; faint 1px line frame inset 24px from edges starting below logo.

---

### 2. Phone (`ScreenPhone`)
**Purpose:** Capture phone number for OTP.

**Layout:**
1. Top bar: back chip (left) · progress dots `■ ─ ─ ─ ─ ─` (center) · spacer (right)
2. **StepHead**: `STEP 01` · gold hairline · `IDENTITY` → serif H1 *"What's your number?"*
3. Subcopy: *"We'll send a one-time code to confirm. Your number is never shared with brands."*
4. **Phone row** (flex, gap 10):
   - Country chip: 22×14 Indian flag (saffron/white/navy chakra/green stripes) + `+91` + chevron
   - Number field (focused, dark border): `98765 4321` with gold caret
5. **Trust pill** (paper bg, 1px line, 4px radius, padding 14 16):
   - 22×22 obsidian circle with gold shield icon
   - Bold inline: *"The member is never the product."* + body *"Your data is never sold to brands."*
6. Fine print: `By continuing you agree to the PlutusClub Member Charter and Privacy Policy.` (underlined links in obsidian)
7. CTA: `SEND CODE`

---

### 3. Verify (`ScreenOTP`)
**Purpose:** 6-digit OTP entry.

**Layout:**
1. Top bar with progress at step 1
2. **StepHead**: `STEP 02 / VERIFICATION` → *"Enter the / six-digit code."*
3. Subcopy: `Sent via SMS to +91 98765 43210. Change` (Change link in goldDeep with bottom border).
4. **OTP grid**: 6 boxes, each **44×64**, 4px radius, gap 6px, justify-between.
   - Filled boxes (positions 1–4): obsidian border, serif 30px digit.
   - Active box (position 5): obsidian border + `inset 0 0 0 1px obsidian` for double-stroke effect + 1.5×28 gold caret.
   - Empty box (position 6): line border, empty.
5. **Resend card**: paper bg, 1px line, padding 16, flex space-between:
   - Left: `RESEND IN` (10px tracked) + serif `0 : 24`
   - Right: `Didn't receive it? CALL INSTEAD` (12px tracked, goldDeep)
6. CTA: `VERIFY` at 0.4 opacity (disabled until 6 digits entered)

---

### 4. Profile (`ScreenName`)
**Purpose:** Collect full name, email, city.

**Layout:**
1. Top bar at step 2
2. **StepHead**: `STEP 03 / THE MEMBER` → *"Tell us / about you."*
3. Subcopy: *"Your name appears on every invoice, ID-verification, and member certificate."*
4. **Fields stack** (gap 12): `FULL NAME`, `EMAIL` (focused with gold accent bar), `CITY`
5. **Founding cohort badge** (obsidian bg, gold corner brackets top-left + bottom-right):
   - 38×38 ringed monogram with gold star ornament
   - `FOUNDING COHORT` (9px gold tracked 2.5)
   - `Member #01,247 of 10,000` — numbers serif 17px gold/cream tabular
6. CTA: `CONTINUE`

---

### 5. Tier (`ScreenTier`)
**Purpose:** Pick one of four membership tiers.

**Layout:**
1. Top bar at step 3
2. **StepHead**: `STEP 04 / THE TIER` → *"Choose your / standing."*
3. Subcopy: *"Each tier unlocks deeper categories and bigger savings. Upgrade anytime."*
4. **Tier rows** (gap 8), each 4px radius padding 16:
   | Tier | Price (₹) | Includes |
   |---|---|---|
   | Silver | 999 / yr | 12 categories |
   | Gold | 3,999 / yr | 28 categories |
   | **Platinum** *(selected)* | 9,999 / yr | 46 categories |
   | Obsidian | 24,999 / yr | All 60 + concierge |

   Each row contains:
   - 3×42 accent stripe (color: tier accent — Silver `#A8A8B0`, Gold `#C9A961`, Platinum cream `#E8E4D8`, Obsidian obsidian)
   - Tier name (serif 22px) + categories label (10px tracked uppercase)
   - Price (serif 22px, gold on selected) + "per year" label
   - 20×20 radio circle (gold filled when selected)
   - Selected row is full obsidian bg with cream text.
   - **Platinum row** has a `RECOMMENDED` ribbon (gold bg, 8.5px tracked 2) positioned `top: -7px; right: 14px;`.
5. CTA: `CONTINUE WITH PLATINUM`

---

### 6. Categories (`ScreenCategories`)
**Purpose:** Pick which buying categories to prioritize.

**Layout:**
1. Top bar at step 4
2. **StepHead**: `STEP 05 / YOUR CATEGORIES` → *"What will you / buy this year?"*
3. Subcopy: `We'll prioritise deals in these categories. **4 of 8 selected**`
4. **2-column grid** (gap 8), each chip 4px radius, padding 14 12, min-height 96:
   - Selected chips: obsidian bg, cream text, gold icon, gold checkmark.
   - Unselected chips: white bg, obsidian text, obsidian icon, empty radio.
   - Each chip: icon (top-left) + checkbox (top-right) + label bottom-left + frequency label below (e.g. `ONCE A DECADE`, `EVERY MONTH`, 9.5px tracked 0.8 uppercase).
   - Categories (selection state shown):
     - ☑ Automobiles · *Once a decade*
     - ☑ Health Insurance · *Every year*
     - ☑ International Holidays · *Quarterly*
     - ☐ Real Estate · *Once a lifetime*
     - ☑ Investments · SIPs · *Every month*
     - ☐ Premium Electronics · *Every 2 yrs*
     - ☐ Luxury Watches · *Once a decade*
     - ☐ Education Abroad · *Once*
5. CTA: `CONTINUE · 4 SELECTED`

---

### 7. Payment (`ScreenPayment`)
**Purpose:** Show order summary + choose payment method.

**Layout:**
1. Top bar at step 5
2. **StepHead**: `STEP 06 / ACTIVATION` → *"Activate your / Platinum tier."*
3. Subcopy: *"One-time charge today. Auto-renews on May 25, 2027. Cancel anytime."*
4. **Receipt card** (white bg, 1px gold-deep@27% border, 4px radius, padding 20 20 18, **gold corner brackets on all 4 corners**):
   - Header row: left = `PLUTUSCLUB · PLATINUM` (eyebrow) + serif "Annual Membership" 19px + `25 MAY 2026 → 25 MAY 2027` (tracked uppercase); right = 46×46 gold-ringed P monogram.
   - **Hairline** (gradient gold-deep)
   - Line items (ReceiptRow): label sans + value serif 15px tabular
     - Membership · 1 year → ₹9,999
     - Founding member credit → −₹1,000 *(both label and value goldDeep, label semibold)*
     - GST (18%) → ₹1,620
   - **Hairline with centered star ornament**
   - Total row: `TOTAL TODAY` (9.5px tracked) + `Incl. all taxes` (10px subtitle) | **₹10,619** serif 30px
5. **SectionDivider**: `CHOOSE PAYMENT METHOD` (9px tracked between two thin hairlines)
6. **Payment methods** (gap 8):
   - UPI · GPay (selected, obsidian border) — `aarav@okhdfcbank`
   - Credit / Debit card — `Visa, Mastercard, Amex, Rupay`
   - Net Banking — `42 banks supported`
   Each row: 36×36 icon tile (obsidian/gold for selected, paper/obsidian for unselected) + title 14/600 + subtitle 11px mute + 18×18 radio (gold dot inside obsidian on selected).
7. CTA: `PAY ₹10,619`

---

### 8. Admitted (`ScreenDone`)
**Purpose:** Confirmation + member certificate.

**Layout (dark bg `#0A0A12`):**
1. 88px top padding → eyebrow `— WELCOME, MEMBER —` (gold)
2. **Certificate** (280px wide, 1px gold border, ink-to-ink2 vertical gradient bg, padding 30 26 24, **outset L-bracket flourishes at all 4 corners**):
   - 44×44 gold-ringed P monogram (centered)
   - `CERTIFICATE OF MEMBERSHIP` (9px tracked 3.5 muteDk)
   - **Member name** serif 24px cream → `Aarav Mehta`
   - `is hereby admitted as a` (11px muteDk)
   - **Tier** serif 26px gold → `Platinum Member`
   - 1px lineDk divider
   - Two columns: `MEMBER NO.` `PC · 01247` (serif 13px gold) | `ADMITTED` `25 · V · 2026` (roman numeral month)
3. Body 13px muteDk: **"Your first deal is ready."** + *"The Maruti Grand Vitara fleet price — ₹1,12,000 below sticker — closes in 4 days."*
4. CTAs stacked: **gold** `ENTER THE CLUB` (primary) + **dark ghost** `VIEW MY CERTIFICATE`.

**Decorative:** Radial gold gradient (`#C9A96133` → transparent) from 20% top, 50% horizontal.

---

## Interactions & Behavior

### Navigation
- Linear flow: Welcome → Phone → OTP → Profile → Tier → Categories → Payment → Admitted.
- Back chip on every screen except Welcome and Admitted; tapping pops one screen.
- Tier selection persists into Payment header ("Activate your Platinum tier", price reflects choice).
- Category chips toggle on tap; counter at bottom CTA updates live.

### Form validation
- Phone: must be 10 digits, India format. Country code locked to +91 in v1.
- OTP: 6 digits, auto-advance per box, auto-submit on last digit. Show error state in red if mismatch (not designed yet — re-use the obsidian border color but `#C44` instead).
- Email: standard regex, show inline error below field.
- All fields: gold accent bar on focus + tighter label color (goldDeep).

### Animations / transitions
- Screen transition: standard iOS push (slide from right, 350ms ease-out).
- OTP digit fill: subtle scale 1 → 1.05 → 1 on receipt (150ms).
- "Recommended" tier ribbon: static.
- Welcome stat strip: static (no count-up).
- Certificate on `ScreenDone`: 600ms fade-in + 8px translate-up on mount.

### State
- `step` (0–7) — current screen index
- `phone`, `otp`, `name`, `email`, `city` — form values
- `tier` — one of `silver | gold | platinum | obsidian`, default `platinum`
- `categories` — Set of category ids
- `paymentMethod` — one of `upi | card | netbanking`
- `memberNumber` — assigned server-side after payment success

### Data fetching
- OTP send/verify → SMS gateway
- Tier prices + categories list should come from `/api/membership/config` (don't hard-code in prod)
- Payment → Razorpay / PayU / Cashfree (India payment gateway TBD)
- Member number generation: server-side, returned on payment success

---

## Files in This Bundle

| File | What it is |
|---|---|
| `PlutusClub Signup Flow.html` | **iOS entry** — mounts the React app inside iOS device frames |
| `PlutusClub Signup Flow — Android.html` | **Android entry** — same screens, Android device frames |
| `screens.jsx` | **The main reference.** All 8 screens, plus shared primitives: `PC` color tokens, `PrimaryBtn`, `GhostBtn`, `Eyebrow`, `Display`, `StepHead`, `Hairline`, `Ornament`, `SectionDivider`, `Field`, `TopBar`, `BackChip`, `Progress`, `ScreenShell`. **Identical across both platforms** — the brand is platform-agnostic. |
| `app.jsx` | Mounts each screen inside iOS frames in a `<DesignCanvas>`. Strip this. |
| `app-android.jsx` | Mounts each screen inside Android frames. Strip this. |
| `ios-frame.jsx` | iOS device chrome scaffolding. Strip — use SwiftUI safe areas / native status bar. |
| `android-frame.jsx` | Android device chrome scaffolding (Material 3 status bar + gesture nav). Strip — use Compose `WindowInsets` / native. |
| `design-canvas.jsx` | Side-by-side presentation chrome. Strip entirely. |

### Platform notes
The visual design is **identical on iOS and Android by intent** — PlutusClub is a luxury members brand and shouldn't shape-shift between platforms. The only platform-specific differences are:
- **Status bar height & icons** (handled by native OS)
- **Back navigation**: iOS uses the back chip; Android can additionally support hardware/gesture back to the same target
- **Font fallback**: SF/system on iOS, Roboto/system on Android. Cormorant Garamond is loaded the same way on both.
- **Bottom safe area**: iOS home indicator vs. Android gesture pill — the CTA's 24px bottom padding accounts for both.

### How to recreate
1. Read `screens.jsx` top-to-bottom. The `PC` constant is your design token source.
2. For each screen function (`ScreenWelcome`, `ScreenPhone`, …), the JSX is the spec.
3. Reuse the shared primitives (`StepHead`, `Hairline`, `Ornament`, etc.) by creating equivalents in your codebase's component layer.
4. Replace `IOSDevice` / `AndroidDevice` (status bar, dynamic island, home indicator, nav pill) with your platform's native chrome.
5. Replace hard-coded copy (`Aarav Mehta`, `01,247`, etc.) with state-driven values.

---

## Assets
No external image assets — everything is inline SVG (logos, icons, flag, certificate flourishes) and CSS gradients. The only external dependency is the **Cormorant Garamond** Google Font, which is loaded via a `<link>` tag injected at runtime in `screens.jsx`.

For production:
- Self-host Cormorant Garamond or use your font hosting (Google Fonts is fine for web; bundle the file for native).
- Re-draw the SVG logo as a vector asset (.svg or platform-native) — the inline version in `screens.jsx` is for reference.
- The Indian flag in the country picker is drawn with 3 horizontal divs + a 4×4 navy dot for the Ashoka Chakra placeholder. Replace with a proper flag asset in prod.

---

## Open Questions for Product
- Do we need a "Why PlutusClub" screen between Welcome and Phone for cold installs?
- Tier change after signup — UI not designed; needs a settings entry point.
- KYC / Aadhaar verification — not in flow yet; will likely sit between Payment and Admitted.
- Concierge intro for Obsidian tier — not in flow.
- Referral code entry — not in flow; possibly belongs in Profile step or as a chip on Payment.

# App Store Submission Checklist — PlutusClub

## Google Play Store

### Pre-submission
- [ ] App signing key generated and stored securely (not in repo)
- [ ] `google-services.json` in `apps/mobile/` (not committed to git)
- [ ] Target SDK: API 34+ (Android 14)
- [ ] minSdk: API 26+ (Android 8)
- [ ] App bundle (AAB) built: `eas build --platform android`
- [ ] Internal test track: tested on 3+ real devices

### Store listing
- [ ] App name: PlutusClub — Luxury Buying Club
- [ ] Short description (80 chars): India's private luxury buying club. Members-only deals on 60+ categories.
- [ ] Full description written (4000 chars max) — emphasize savings, PC Tokens, referral program
- [ ] Screenshots: 4+ phone screenshots (1080×1920 or 1080×2340)
- [ ] Feature graphic: 1024×500 (required for Play Store featuring)
- [ ] App icon: 512×512 PNG (no alpha)
- [ ] Category: Shopping
- [ ] Content rating: Everyone (no objectionable content)

### Privacy & compliance
- [ ] Privacy policy URL: https://plutusclub.in/privacy
- [ ] Data safety form completed:
  - [ ] Payment info: collected (Razorpay), encrypted in transit, not shared
  - [ ] Personal info (name, email, phone): collected, used for account
  - [ ] Location: not collected
- [ ] Target audience: 18+ (financial services)

### Technical
- [ ] No debug flags in production build (`__DEV__` false)
- [ ] ProGuard/R8 enabled for release
- [ ] Permissions: only `INTERNET`, `VIBRATE` (no unnecessary permissions)
- [ ] Deep links tested: `plutusclub://member/deals`, `plutusclub://bookings`

---

## Apple App Store

### Pre-submission
- [ ] Apple Developer account active
- [ ] Distribution certificate valid
- [ ] Provisioning profile: App Store distribution
- [ ] `GoogleService-Info.plist` in `apps/mobile/` (not committed to git)
- [ ] IPA built: `eas build --platform ios`
- [ ] TestFlight: internal testing with 5+ testers

### Store listing
- [ ] App name: PlutusClub
- [ ] Subtitle (30 chars): Luxury Deals & PC Tokens
- [ ] Description: same content as Play Store, adapted for App Store tone
- [ ] Keywords (100 chars): luxury, deals, members, shopping, savings, india, premium
- [ ] Screenshots: 6.7" (iPhone 15 Pro Max) and 12.9" (iPad) required
- [ ] App Preview video: optional but recommended
- [ ] App icon: 1024×1024 PNG (no alpha, no rounded corners — Apple adds them)

### Review information
- [ ] Demo account credentials provided to reviewer
  - Phone: use a test number that accepts code 123456
  - Note: OTP-based login, no password
- [ ] Notes for reviewer: "This is a private membership app. Use demo credentials above."

### Privacy & compliance
- [ ] Privacy policy URL in App Store Connect
- [ ] App Privacy nutrition label completed:
  - [ ] Purchases: none (payments via Razorpay web checkout)
  - [ ] Financial Info: payment history (linked to identity)
  - [ ] Contact Info: name, email, phone (linked to identity)
  - [ ] Identifiers: user ID (linked to identity)
- [ ] App uses Sign in with Apple? No (OTP-based auth)

### Technical
- [ ] No non-exempt encryption (OTP + HTTPS only — standard exemption applies)
- [ ] Push notifications entitlement: yes (for booking confirmations)
- [ ] Associated domains: `applinks:plutusclub.in` in entitlements
- [ ] Universal links tested: `https://plutusclub.in/member/deals`

---

## Post-submission

- [ ] Monitor review status (typically 24-48h)
- [ ] Respond to reviewer questions within 24h
- [ ] Staged rollout: start at 10%, monitor crash rate, ramp up over 3 days
- [ ] Crashlytics / Sentry monitoring active from day 1

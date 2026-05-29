# Mobile Development Guide — PlutusClub

React Native + Expo 52 app for Android and iOS.

## Prerequisites

```bash
npm install -g expo-cli eas-cli
# Android: Android Studio + SDK 34
# iOS: Xcode 15+ (macOS only)
```

## Running locally

```bash
cd apps/mobile
npm install
cp .env.example .env.local
# Set EXPO_PUBLIC_API_URL=http://localhost:3000 for local dev

# Start Expo dev server
npm start

# Android emulator
npm run android

# iOS simulator (macOS only)
npm run ios
```

## Environment

`apps/mobile/.env.local`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

For production, `EXPO_PUBLIC_API_URL=https://plutusclub.in`.

## Project structure

```
apps/mobile/
  src/
    lib/
      brand.ts        ← standalone copy of web brand config
      api.ts          ← typed fetch wrapper (apiGet / apiPost)
      auth.ts         ← session management via expo-secure-store
      notifications.ts ← push notification registration
      storage.ts      ← generic SecureStore wrapper
    navigation/
      RootNavigator.tsx    ← Auth vs Member stack switch
      AuthNavigator.tsx    ← SignIn → OTP
      MemberNavigator.tsx  ← tab nav: Dashboard/Deals/Wallet/Referral/Settings
      linking.ts           ← deep link config
    screens/
      auth/           ← SignInScreen, OTPScreen
      member/         ← DashboardScreen, DealsScreen, DealDetailScreen,
                         WalletScreen, ReferralScreen, SettingsScreen
    components/       ← TierBadge, DealCard, LoadingSpinner, ErrorBanner
    hooks/
      useVersionCheck.ts ← force-update on launch
```

## Deep linking

Scheme: `plutusclub://`
Universal links: `https://plutusclub.in`

```
plutusclub://deals/deal-uuid    → DealDetailScreen
plutusclub://wallet             → WalletScreen
plutusclub://referral           → ReferralScreen
```

For universal links, add `apple-app-site-association` (iOS) and `assetlinks.json` (Android) to the web app's `public/` directory.

## Push notifications

Uses Expo Push Notifications (expo-notifications). On first launch after auth, the app requests permission and registers the Expo push token with the backend via `POST /api/push/subscribe`.

Tokens are stored in the `push_subscriptions` table. The backend queues push notifications via `POST /api/internal/push/send`.

**Test a push notification:**
```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{"to": "ExponentPushToken[xxx]", "title": "Test", "body": "Hello!"}'
```

## Building for production

```bash
# One-time setup
eas login
eas build:configure

# Android APK (internal testing)
cd apps/mobile
eas build --platform android --profile preview

# Android App Bundle (Play Store)
eas build --platform android --profile production

# iOS (App Store / TestFlight)
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android --latest
eas submit --platform ios --latest
```

## App version management

`src/hooks/useVersionCheck.ts` calls `GET /api/app/version` on launch. If the installed version is below `min_version` (set in Admin → Settings → `app.minVersion`), a force-update alert is shown.

To trigger a force update:
1. Admin → Settings → Site Config
2. Set `app.minVersion` to the new minimum version string (e.g. `1.1.0`)
3. All users on older versions see the update alert on next launch

## Brand customisation

`src/lib/brand.ts` is a standalone copy of the web `lib/brand.ts`. When changing the brand:
1. Update `lib/brand.ts` in the web root
2. Copy the same values to `apps/mobile/src/lib/brand.ts`
3. Run `npm run brand:check` to verify no hardcoded strings remain in the web app

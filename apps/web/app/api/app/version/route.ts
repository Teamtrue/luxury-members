/**
 * app/api/app/version/route.ts
 * ---------------------------------------------------------------------------
 * App version check for mobile force-update flows.
 *
 * GET /api/app/version — Public endpoint; no auth required.
 *
 * Returns the minimum required version, current latest version, a force-update
 * message, and store URLs so mobile clients can decide whether to block launch
 * and direct the user to the appropriate app store.
 * ---------------------------------------------------------------------------
 */

import { apiSuccess }    from '@/lib/api-helpers';
import { getSiteConfig } from '@/lib/site-config';
import { brand }         from '@/lib/brand';

export async function GET(): Promise<Response> {
  const config = await getSiteConfig();

  const minVersion        = (config['app.minVersion']        as string | undefined) ?? '1.0.0';
  const currentVersion    = (config['app.currentVersion']    as string | undefined) ?? '1.0.0';
  const forceUpdateMessage = (config['app.forceUpdateMessage'] as string | undefined)
    ?? 'Please update to continue.';

  return apiSuccess({
    min_version:          minVersion,
    current_version:      currentVersion,
    force_update_message: forceUpdateMessage,
    platform_urls: {
      android: `https://play.google.com/store/apps/details?id=${brand.androidPackage}`,
      ios:     `https://apps.apple.com/app/${brand.bundleId}`,
    },
  });
}

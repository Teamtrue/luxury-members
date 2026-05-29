import { redirect } from 'next/navigation';

/**
 * Public /bookings redirect — authenticated members are taken to
 * /member/bookings; unauthenticated visitors are sent to sign-in.
 * The actual bookings list lives behind the member portal.
 */
export default function BookingsRedirectPage() {
  redirect('/member/bookings');
}

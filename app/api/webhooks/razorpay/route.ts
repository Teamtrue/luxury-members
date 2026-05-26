import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Razorpay sends payment events here — must be registered in Razorpay Dashboard
// Settings → Webhooks → Add webhook URL: https://plutusclub.in/api/webhooks/razorpay

export async function POST(req: Request) {
  const body = await req.text(); // raw body for signature verification
  const signature = req.headers.get('x-razorpay-signature');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('Razorpay webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);
  console.log('Razorpay webhook event:', event.event);

  switch (event.event) {
    case 'payment.captured': {
      const payment = event.payload.payment.entity;
      // TODO: Find booking by razorpay_order_id, update status to 'confirmed'
      // TODO: Credit PC Tokens to member
      // TODO: Send confirmation email/SMS
      console.log('Payment captured:', payment.id, 'Order:', payment.order_id, 'Amount:', payment.amount / 100);
      break;
    }
    case 'payment.failed': {
      const payment = event.payload.payment.entity;
      // TODO: Update booking status to 'payment_failed'
      // TODO: Notify member
      console.log('Payment failed:', payment.id, 'Reason:', payment.error_description);
      break;
    }
    case 'refund.created': {
      const refund = event.payload.refund.entity;
      // TODO: Update booking status, reverse PC Tokens
      console.log('Refund created:', refund.id, 'Amount:', refund.amount / 100);
      break;
    }
    case 'subscription.charged': {
      // For future: membership renewal via Razorpay Subscriptions
      console.log('Subscription charged:', event.payload);
      break;
    }
    default:
      console.log('Unhandled webhook event:', event.event);
  }

  return NextResponse.json({ received: true });
}

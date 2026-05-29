/**
 * worker/processors/webhooks.ts
 * Processes webhook events stored in the webhook_events table.
 * Job data: { eventId: string }
 */

import { Worker, Job } from 'bullmq'
import { redisConnection } from '../redis'
import { createServiceRoleClient } from '@plutusclub/db'

interface WebhookJobData {
  eventId: string
}

export function startWebhookWorker(): Worker {
  const worker = new Worker<WebhookJobData>(
    'webhooks',
    async (job: Job<WebhookJobData>) => {
      const { eventId } = job.data
      const db = createServiceRoleClient()

      // Mark as processing
      await db.from('webhook_events')
        .update({ status: 'processing', attempts: job.attemptsMade + 1 })
        .eq('id', eventId)

      // Load event
      const { data: event, error } = await db
        .from('webhook_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error || !event) throw new Error(`Event ${eventId} not found`)

      // Route by provider + event_type
      const payload = event.payload as Record<string, unknown>

      if (event.provider === 'razorpay') {
        await handleRazorpayEvent(db, event.event_type as string, payload)
      }

      // Mark as processed
      await db.from('webhook_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', eventId)
    },
    { ...redisConnection, concurrency: 5 }
  )

  worker.on('failed', (job, err) => {
    console.error(`[worker:webhooks] job ${job?.id} failed:`, err.message)
    if (job?.data.eventId) {
      createServiceRoleClient()
        .from('webhook_events')
        .update({ status: 'failed', last_error: err.message })
        .eq('id', job.data.eventId)
        .then(() => {}, () => {})
    }
  })

  console.info('[worker:webhooks] started')
  return worker
}

async function handleRazorpayEvent(
  db: ReturnType<typeof createServiceRoleClient>,
  eventType: string,
  payload: Record<string, unknown>
) {
  if (eventType === 'payment.captured') {
    const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined
    const entity = (paymentEntity?.entity ?? paymentEntity) as Record<string, unknown> | undefined
    const orderId = entity?.order_id as string | undefined
    if (!orderId) return

    // Find booking by order_id
    const { data: payment } = await db
      .from('payments')
      .select('id, booking_id, amount_paise')
      .eq('provider_order_id', orderId)
      .maybeSingle()

    if (!payment?.booking_id) return

    // Confirm booking
    await db.from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', payment.booking_id)
      .eq('status', 'pending')

    // Activate membership if this is a membership payment
    const { data: membership } = await db
      .from('memberships')
      .select('id, status')
      .eq('payment_id', payment.id)
      .maybeSingle()

    if (membership && membership.status === 'pending') {
      await db.from('memberships')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', membership.id)
    }
  }
}

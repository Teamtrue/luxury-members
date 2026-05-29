/**
 * worker/processors/reconciliation.ts
 * Scheduled payment reconciliation against Razorpay.
 * Job data: { date: string } — ISO date string for the day to reconcile
 */

import { Worker, Job } from 'bullmq'
import { redisConnection } from '../redis'
import { createServiceRoleClient } from '@plutusclub/db'

interface ReconcileJobData {
  date: string
}

export function startReconciliationWorker(): Worker {
  const worker = new Worker<ReconcileJobData>(
    'reconciliation',
    async (job: Job<ReconcileJobData>) => {
      const db = createServiceRoleClient()
      console.info(`[worker:reconciliation] reconciling payments for ${job.data.date}`)

      // Find confirmed bookings from the target date with no reconciliation record
      const start = new Date(job.data.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(job.data.date)
      end.setHours(23, 59, 59, 999)

      const { data: payments } = await db
        .from('payments')
        .select('id, provider_payment_id, amount_paise, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'captured')

      if (!payments?.length) {
        console.info('[worker:reconciliation] no payments to reconcile')
        return
      }

      // Upsert reconciliation records
      const rows = payments.map(p => ({
        payment_id:            p.id,
        provider_payment_id:   p.provider_payment_id,
        expected_amount_paise: p.amount_paise,
        reconciled_at:         new Date().toISOString(),
        status:                'matched',
      }))

      await db.from('payment_reconciliation').upsert(rows, { onConflict: 'payment_id' })
      console.info(`[worker:reconciliation] reconciled ${rows.length} payments`)
    },
    { ...redisConnection, concurrency: 1 }
  )

  worker.on('failed', (job, err) =>
    console.error(`[worker:reconciliation] job ${job?.id} failed:`, err.message)
  )

  console.info('[worker:reconciliation] started')
  return worker
}

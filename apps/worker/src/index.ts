/**
 * worker/index.ts
 * PlutusClub background job worker.
 * Run: pnpm worker:dev (development) or pnpm worker:start (production)
 *
 * Starts three BullMQ workers:
 *   - webhooks      — processes inbound provider webhook events
 *   - notifications — dispatches queued member notifications
 *   - reconciliation — nightly payment reconciliation against Razorpay
 */

import { startWebhookWorker }        from './processors/webhooks'
import { startNotificationWorker }   from './processors/notifications'
import { startReconciliationWorker } from './processors/reconciliation'

const workers = [
  startWebhookWorker(),
  startNotificationWorker(),
  startReconciliationWorker(),
]

console.info(`[worker] PlutusClub worker started — ${workers.length} queues active`)

// Graceful shutdown
async function shutdown(signal: string) {
  console.info(`[worker] ${signal} received — shutting down gracefully`)
  await Promise.all(workers.map(w => w.close()))
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

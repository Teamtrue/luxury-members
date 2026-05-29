/**
 * worker/queues.ts
 * Queue definitions. Import these in both the web app (to enqueue jobs)
 * and the worker process (to process jobs).
 */

import { Queue } from 'bullmq'
import { redisConnection } from './redis'

export const webhookQueue      = new Queue('webhooks',      redisConnection)
export const notificationQueue = new Queue('notifications', redisConnection)
export const reconcileQueue    = new Queue('reconciliation', redisConnection)

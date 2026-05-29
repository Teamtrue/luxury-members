/**
 * worker/processors/notifications.ts
 * Processes queued notifications from the notifications table.
 * Job data: { notificationId: string }
 */

import { Worker, Job } from 'bullmq'
import { redisConnection } from '../redis'
import { createServiceRoleClient } from '@plutusclub/db'

interface NotificationJobData {
  notificationId: string
}

export function startNotificationWorker(): Worker {
  const worker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      const db = createServiceRoleClient()
      const { data: notif } = await db
        .from('notifications')
        .select('*')
        .eq('id', job.data.notificationId)
        .single()

      if (!notif) return

      // Call the existing internal dispatch endpoint
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/internal/notifications/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_JOB_TOKEN ?? ''}`,
        },
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Dispatch failed: ${res.status} ${body}`)
      }
    },
    { ...redisConnection, concurrency: 10 }
  )

  worker.on('failed', (job, err) =>
    console.error(`[worker:notifications] job ${job?.id} failed:`, err.message)
  )

  console.info('[worker:notifications] started')
  return worker
}

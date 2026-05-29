/**
 * worker/redis.ts
 * Shared ioredis connection for BullMQ workers.
 * Reads REDIS_URL from environment (Upstash or any Redis-compatible URL).
 */

import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL

if (!REDIS_URL && process.env.NODE_ENV === 'production') {
  throw new Error('REDIS_URL env var is required in production')
}

export const redis = new Redis(REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck:     false,
})

export const redisConnection = { connection: redis }

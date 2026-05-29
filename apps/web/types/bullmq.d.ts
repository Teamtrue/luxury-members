/**
 * Minimal type stub for bullmq.
 * The full package is declared in package.json but not yet installed in this
 * environment. This stub silences TypeScript errors so the codebase can be
 * type-checked without a network-connected npm install.
 *
 * Replace this file with the real package types once `npm install` succeeds:
 *   rm types/bullmq.d.ts && npm install
 */

declare module 'bullmq' {
  export interface BackoffOptions {
    type: 'exponential' | 'fixed';
    delay: number;
  }

  export interface JobOptions {
    attempts?: number;
    backoff?: BackoffOptions;
    delay?: number;
    priority?: number;
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
    [key: string]: unknown;
  }

  export interface WorkerOptions {
    concurrency?: number;
    attempts?: number;
    backoff?: BackoffOptions;
    connection?: unknown;
    maxStalledCount?: number;
    stalledInterval?: number;
    [key: string]: unknown;
  }

  export interface QueueOptions {
    connection?: unknown;
    defaultJobOptions?: JobOptions;
    [key: string]: unknown;
  }

  export interface Job<T = unknown> {
    id?: string;
    name: string;
    data: T;
    attemptsMade: number;
    opts: JobOptions;
  }

  export class Worker<T = unknown> {
    constructor(
      name: string,
      processor: (job: Job<T>) => Promise<void>,
      opts?: WorkerOptions
    );
    on(event: 'failed', handler: (job: Job<T> | undefined, err: Error) => void): this;
    on(event: 'completed', handler: (job: Job<T>) => void): this;
    on(event: 'error', handler: (err: Error) => void): this;
    on(event: string, handler: (...args: unknown[]) => void): this;
    close(): Promise<void>;
  }

  export class Queue<T = unknown> {
    constructor(name: string, opts?: QueueOptions);
    add(name: string, data: T, opts?: JobOptions): Promise<Job<T>>;
    addBulk(jobs: Array<{ name: string; data: T; opts?: JobOptions }>): Promise<Job<T>[]>;
    drain(): Promise<void>;
    close(): Promise<void>;
  }

  export class QueueEvents {
    constructor(name: string, opts?: { connection?: unknown });
    on(event: string, handler: (...args: unknown[]) => void): this;
    close(): Promise<void>;
  }
}

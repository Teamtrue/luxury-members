/**
 * Minimal type stub for ioredis.
 * The full package is declared in package.json but not yet installed in this
 * environment.  This stub silences TypeScript errors so the codebase can be
 * type-checked without a network-connected npm install.
 *
 * Replace this file with the real package types once `npm install` succeeds:
 *   rm types/ioredis.d.ts && npm install
 */

declare module 'ioredis' {
  interface RedisOptions {
    maxRetriesPerRequest?: number | null;
    lazyConnect?: boolean;
    keepAlive?: number;
    enableReadyCheck?: boolean;
    [key: string]: unknown;
  }

  class Redis {
    constructor(url: string, options?: RedisOptions);
    constructor(options?: RedisOptions);

    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;

    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ...args: string[]): Promise<'OK'>;
    del(...keys: string[]): Promise<number>;
    quit(): Promise<'OK'>;
    disconnect(): void;
  }

  export default Redis;
}

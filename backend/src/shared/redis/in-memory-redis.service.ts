import { Injectable } from "@nestjs/common";
import type { IdempotencyStore } from "./idempotency-store";

interface Entry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class InMemoryRedisService implements IdempotencyStore {
  private readonly store = new Map<string, Entry>();

  private isExpired(entry: Entry): boolean {
    return Date.now() > entry.expiresAt;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) return null;
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const existing = this.store.get(key);
    if (existing && !this.isExpired(existing)) return false;
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }

  reset(): void {
    this.store.clear();
  }
}

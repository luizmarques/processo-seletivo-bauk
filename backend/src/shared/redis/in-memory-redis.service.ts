import { Injectable } from "@nestjs/common";
import type { IdempotencyStore } from "./idempotency-store";

interface Entry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class InMemoryRedisService implements IdempotencyStore {
  private readonly store = new Map<string, Entry>();

  private makeEntry(value: string, ttlSeconds: number): Entry {
    return { value, expiresAt: Date.now() + ttlSeconds * 1000 };
  }

  private isExpired(entry: Entry): boolean {
    return Date.now() > entry.expiresAt;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, this.makeEntry(value, ttlSeconds));
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const existing = this.store.get(key);
    if (existing && !this.isExpired(existing)) return false;
    this.store.set(key, this.makeEntry(value, ttlSeconds));
    return true;
  }

  reset(): void {
    this.store.clear();
  }
}

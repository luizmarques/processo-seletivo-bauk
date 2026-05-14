import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import type { TokenBlocklist } from "../auth/token-blocklist";
import type { IdempotencyStore } from "./idempotency-store";

@Injectable()
export class RedisService implements IdempotencyStore, TokenBlocklist {
  constructor(@Inject(Redis) private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, "EX", ttlSeconds);
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.redis.set(key, value, "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  async block(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(`blocklist:jti:${jti}`, "1", "EX", ttlSeconds);
  }

  async isBlocked(jti: string): Promise<boolean> {
    const result = await this.redis.get(`blocklist:jti:${jti}`);
    return result !== null;
  }
}

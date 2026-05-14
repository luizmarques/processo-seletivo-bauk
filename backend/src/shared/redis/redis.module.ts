import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";
import { IDEMPOTENCY_STORE, TOKEN_BLOCKLIST } from "../constants/injection-tokens";
import { RedisService } from "./redis.service";

@Global()
@Module({
  providers: [
    {
      provide: Redis,
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST ?? "localhost",
          port: Number(process.env.REDIS_PORT ?? 6379),
        }),
    },
    RedisService,
    { provide: IDEMPOTENCY_STORE, useExisting: RedisService },
    { provide: TOKEN_BLOCKLIST, useExisting: RedisService },
  ],
  exports: [Redis, RedisService, IDEMPOTENCY_STORE, TOKEN_BLOCKLIST],
})
export class RedisModule {}

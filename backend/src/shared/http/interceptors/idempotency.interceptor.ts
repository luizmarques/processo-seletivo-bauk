import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { IdempotencyKey } from '../idempotency-key';
import { RedisService } from '../../redis/redis.service';

const IDEMPOTENCY_LOCK_MESSAGE =
  'Esta transação acabou de ser realizada e, por segurança, não pode ser enviada novamente agora.';
const IDEMPOTENCY_REQUIRED_MESSAGE = 'O header Idempotency-Key é obrigatório para transferências.';
const IDEMPOTENCY_HEADER = 'idempotency-key';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = this.resolveIdempotencyKey(request);

    if (request.method !== 'POST' || !idempotencyKey) {
      return next.handle();
    }

    const cacheKey = `idempotency:${String(idempotencyKey)}`;
    const configuredTtl = Number(process.env.IDEMPOTENCY_TTL_SECONDS ?? 5);
    const ttl = Number.isFinite(configuredTtl) && configuredTtl > 0 ? configuredTtl : 5;

    return from(this.redisService.get(cacheKey)).pipe(
      mergeMap((cachedResponse) => {
        if (cachedResponse) {
          throw new ConflictException(IDEMPOTENCY_LOCK_MESSAGE);
        }

        return from(this.redisService.setIfNotExists(cacheKey, 'processing', ttl)).pipe(
          mergeMap((locked) => {
            if (!locked) {
              return from(this.redisService.get(cacheKey)).pipe(
                mergeMap((currentValue) => {
                  if (currentValue) {
                    throw new ConflictException(IDEMPOTENCY_LOCK_MESSAGE);
                  }
                  throw new ConflictException(IDEMPOTENCY_LOCK_MESSAGE);
                }),
              );
            }

            return next.handle().pipe(
              mergeMap((response) =>
                from(this.redisService.set(cacheKey, JSON.stringify(response), ttl)).pipe(map(() => response)),
              ),
            );
          }),
        );
      }),
    );
  }

  private resolveIdempotencyKey(request: {
    method: string;
    path?: string;
    url?: string;
    headers: Record<string, unknown>;
  }): string | null {
    const routePath = request.path ?? request.url ?? '';
    const headerKey = request.headers[IDEMPOTENCY_HEADER];
    const normalizedKey = typeof headerKey === 'string' ? headerKey.trim() : '';

    if (request.method === 'POST' && routePath.includes('/wallet/transfer')) {
      if (!normalizedKey) {
        throw new BadRequestException(IDEMPOTENCY_REQUIRED_MESSAGE);
      }
      return IdempotencyKey.fromRaw(normalizedKey).toString();
    }

    return normalizedKey.length > 0 ? IdempotencyKey.fromRaw(normalizedKey).toString() : null;
  }
}

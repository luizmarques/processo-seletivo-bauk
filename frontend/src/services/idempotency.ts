import { normalizeMoneyInput } from './money';

const DEFAULT_IDEMPOTENCY_TIME_WINDOW_SECONDS = 5;

function resolveTimeWindowSeconds(): number {
  const rawValue = Number(import.meta.env.VITE_IDEMPOTENCY_TIME_WINDOW_SECONDS ?? DEFAULT_IDEMPOTENCY_TIME_WINDOW_SECONDS);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : DEFAULT_IDEMPOTENCY_TIME_WINDOW_SECONDS;
}

export function buildTransferIdempotencyKey(input: {
  senderUsername: string;
  recipientUsername: string;
  value: string;
}): string {
  const senderUsername = input.senderUsername.trim().toLowerCase();
  const recipientUsername = input.recipientUsername.trim().toLowerCase();
  const normalizedValue = normalizeMoneyInput(input.value);
  const timeBucket = Math.floor(Date.now() / (resolveTimeWindowSeconds() * 1000));

  return `${senderUsername}:${recipientUsername}:${normalizedValue}:${timeBucket}`;
}

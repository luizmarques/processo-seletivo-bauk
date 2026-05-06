import { normalizeMoneyInput } from './money';

const DEFAULT_IDEMPOTENCY_TIME_COMPONENT = '10';

function resolveTimeComponent(providedTime?: string): string {
  const explicitTime =
    providedTime?.trim() ??
    import.meta.env.VITE_IDEMPOTENCY_TIME?.trim() ??
    import.meta.env.IDEMPOTENCY_TIME?.trim() ??
    import.meta.env.IDEMPOTENCY_TIME_SECONDS?.trim() ??
    '';

  return explicitTime.length > 0 ? explicitTime : DEFAULT_IDEMPOTENCY_TIME_COMPONENT;
}

export function buildTransferIdempotencyKey(input: {
  senderUsername: string;
  recipientUsername: string;
  value: string;
  time?: string;
}): string {
  const senderUsername = input.senderUsername.trim().toLowerCase();
  const recipientUsername = input.recipientUsername.trim().toLowerCase();
  const normalizedValue = normalizeMoneyInput(input.value);
  const time = resolveTimeComponent(input.time);

  return `${senderUsername}:${recipientUsername}:${normalizedValue}:${time}`;
}

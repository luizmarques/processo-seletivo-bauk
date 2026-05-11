import { normalizeMoneyInput } from "./money";
import {
  toIdempotencyKey,
  toTimeComponent,
  type IdempotencyKey,
  type MoneyAmount,
  type TimeComponent,
  type Username,
} from "../types/value-objects";

const DEFAULT_IDEMPOTENCY_TIME_COMPONENT = toTimeComponent("10");

function resolveTimeComponent(providedTime?: string): TimeComponent {
  const explicitTime =
    providedTime?.trim() ??
    import.meta.env.VITE_IDEMPOTENCY_TIME?.trim() ??
    import.meta.env.IDEMPOTENCY_TIME?.trim() ??
    import.meta.env.IDEMPOTENCY_TIME_SECONDS?.trim() ??
    "";

  return explicitTime.length > 0
    ? toTimeComponent(explicitTime)
    : DEFAULT_IDEMPOTENCY_TIME_COMPONENT;
}

export function buildTransferIdempotencyKey(input: {
  senderUsername: Username;
  recipientUsername: Username;
  value: MoneyAmount;
  time?: string;
}): IdempotencyKey {
  const senderUsername = input.senderUsername.trim().toLowerCase();
  const recipientUsername = input.recipientUsername.trim().toLowerCase();
  const normalizedValue = normalizeMoneyInput(input.value);
  const time = resolveTimeComponent(input.time);

  return toIdempotencyKey(
    `${senderUsername}:${recipientUsername}:${normalizedValue}:${time}`,
  );
}

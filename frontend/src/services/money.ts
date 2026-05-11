import { toMoneyAmount, type MoneyAmount } from "../types/value-objects";

const INTERNAL_SCALE = 4;
const DISPLAY_SCALE = 2;

export function normalizeMoneyInput(value: string): MoneyAmount {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,4})?$/.test(normalized)) {
    return toMoneyAmount(normalized);
  }

  const [integerPart, fractionalPart = ""] = normalized.split(".");
  return toMoneyAmount(
    `${integerPart}.${fractionalPart.padEnd(INTERNAL_SCALE, "0")}`,
  );
}

export function formatMoneyForDisplay(value: MoneyAmount | number): string {
  const normalized = normalizeMoneyInput(String(value));
  if (!/^\d+\.\d{4}$/.test(normalized)) {
    return String(value);
  }

  const [integerPart, fractionalPart] = normalized.split(".");
  const keptFraction = fractionalPart.slice(0, DISPLAY_SCALE);
  const discarded = Number(fractionalPart.slice(DISPLAY_SCALE));
  let cents = BigInt(integerPart) * 100n + BigInt(keptFraction);

  if (discarded > 50) {
    cents += 1n;
  } else if (discarded === 50 && cents % 2n !== 0n) {
    cents += 1n;
  }

  const integerResult = cents / 100n;
  const fractionResult = (cents % 100n).toString().padStart(DISPLAY_SCALE, "0");
  return `${integerResult.toString()}.${fractionResult}`;
}

import Decimal from 'decimal.js';

const DISPLAY_SCALE = 2;

export function formatMoneyForDisplay(input: Decimal.Value): string {
  const value = new Decimal(input);
  const factor = new Decimal(10).pow(DISPLAY_SCALE);
  const scaled = value.mul(factor);
  const truncated = scaled.trunc();
  const discarded = scaled.minus(truncated).abs();

  let rounded = truncated;
  if (discarded.greaterThan(0.5)) {
    rounded = incrementUnit(truncated);
  } else if (discarded.equals(0.5) && truncated.abs().mod(2).equals(1)) {
    rounded = incrementUnit(truncated);
  }

  return rounded.div(factor).toFixed(DISPLAY_SCALE);
}

function incrementUnit(value: Decimal): Decimal {
  return value.isNegative() ? value.minus(1) : value.plus(1);
}

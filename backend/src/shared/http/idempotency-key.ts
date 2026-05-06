export class IdempotencyKey {
  private constructor(private readonly value: string) {}

  static fromRaw(input: string): IdempotencyKey {
    // Canonical UUID casing avoids distinct Redis keys for the same client key.
    const normalized = input.trim().toLowerCase();
    return new IdempotencyKey(normalized);
  }

  toString(): string {
    return this.value;
  }
}

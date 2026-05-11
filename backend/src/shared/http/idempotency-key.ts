export class IdempotencyKey {
  private constructor(private readonly value: string) {}

  static fromRaw(input: string): IdempotencyKey {
    const normalized = input.trim().toLowerCase();
    return new IdempotencyKey(normalized);
  }

  toString(): string {
    return this.value;
  }
}

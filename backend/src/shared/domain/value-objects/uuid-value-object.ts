import { ValidationDomainError } from '../errors/domain.errors';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export abstract class UuidValueObject {
  protected constructor(private readonly value: string, label: string) {
    if (!UUID_PATTERN.test(value)) {
      throw new ValidationDomainError(`${label} invalido.`);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: UuidValueObject): boolean {
    return this.value === other.toString();
  }
}


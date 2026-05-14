import { ValidationDomainError } from "../../../../shared/domain/errors/domain.errors";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;

export class PasswordHash {
  private readonly value: string;

  constructor(input: string) {
    if (!BCRYPT_HASH_PATTERN.test(input)) {
      throw new ValidationDomainError("Hash de senha inválido.");
    }
    this.value = input;
  }

  toString(): string {
    return this.value;
  }
}

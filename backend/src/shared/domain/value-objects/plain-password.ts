import { ValidationDomainError } from "../errors/domain.errors";

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export class PlainPassword {
  private readonly value: string;

  constructor(input: string) {
    if (!PASSWORD_PATTERN.test(input)) {
      throw new ValidationDomainError(
        "A senha deve conter ao menos 8 caracteres, uma letra maiúscula e um número.",
      );
    }
    this.value = input;
  }

  toString(): string {
    return this.value;
  }
}

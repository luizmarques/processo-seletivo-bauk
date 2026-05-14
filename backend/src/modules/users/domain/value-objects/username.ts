import {
  ResourceConflictError,
  ValidationDomainError,
} from "../../../../shared/domain/errors/domain.errors";

export class Username {
  private readonly value: string;

  constructor(input: string) {
    const normalized = input.trim().toLowerCase();
    if (normalized.length < 3) {
      throw new ValidationDomainError(
        "Username deve possuir ao menos 3 caracteres.",
      );
    }
    this.value = normalized;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Username): boolean {
    return this.value === other.toString();
  }

  ensureDifferentFrom(other: Username): void {
    if (this.equals(other)) {
      throw new ResourceConflictError("Username deve ser diferente.");
    }
  }
}

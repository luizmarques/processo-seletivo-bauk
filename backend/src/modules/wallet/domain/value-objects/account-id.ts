import { UuidValueObject } from "../../../../shared/domain/value-objects/uuid-value-object";

export class AccountId extends UuidValueObject {
  constructor(value: string) {
    super(value, "AccountId");
  }
}

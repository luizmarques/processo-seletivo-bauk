import { UuidValueObject } from "./uuid-value-object";

export class AccountId extends UuidValueObject {
  constructor(value: string) {
    super(value, "AccountId");
  }
}

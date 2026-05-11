import { UuidValueObject } from "./uuid-value-object";

export class TransactionId extends UuidValueObject {
  constructor(value: string) {
    super(value, "TransactionId");
  }
}

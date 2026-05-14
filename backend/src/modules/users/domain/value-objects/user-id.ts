import { UuidValueObject } from "../../../../shared/domain/value-objects/uuid-value-object";

export class UserId extends UuidValueObject {
  constructor(value: string) {
    super(value, "UserId");
  }
}

import { UuidValueObject } from './uuid-value-object';

export class UserId extends UuidValueObject {
  constructor(value: string) {
    super(value, 'UserId');
  }
}


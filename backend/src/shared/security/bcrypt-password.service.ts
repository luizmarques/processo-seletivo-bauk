import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHash } from '../domain/value-objects/password-hash';
import { PlainPassword } from '../domain/value-objects/plain-password';

export interface PasswordHasher {
  hash(value: PlainPassword): Promise<PasswordHash>;
  compare(value: PlainPassword, hashed: PasswordHash): Promise<boolean>;
}

@Injectable()
export class BcryptPasswordService implements PasswordHasher {
  async hash(value: PlainPassword): Promise<PasswordHash> {
    return new PasswordHash(await bcrypt.hash(value.toString(), 10));
  }

  async compare(value: PlainPassword, hashed: PasswordHash): Promise<boolean> {
    return bcrypt.compare(value.toString(), hashed.toString());
  }
}

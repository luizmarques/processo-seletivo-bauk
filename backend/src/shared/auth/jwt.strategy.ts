import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccountId } from '../domain/value-objects/account-id';
import { UserId } from '../domain/value-objects/user-id';
import { Username } from '../domain/value-objects/username';
import type { CurrentUser } from '../http/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'supersecretjwtkey',
    });
  }

  validate(payload: { sub: string; username: string; accountId: string }): CurrentUser {
    return {
      userId: new UserId(payload.sub),
      username: new Username(payload.username),
      accountId: new AccountId(payload.accountId),
    };
  }
}

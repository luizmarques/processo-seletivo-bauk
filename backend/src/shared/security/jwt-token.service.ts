import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccountId } from "../../modules/wallet/domain/value-objects/account-id";
import { UserId } from "../domain/value-objects/user-id";
import { Username } from "../domain/value-objects/username";

export interface TokenPayload {
  sub: UserId;
  username: Username;
  accountId: AccountId;
}

export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
}

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async sign(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync({
      sub: payload.sub.toString(),
      username: payload.username.toString(),
      accountId: payload.accountId.toString(),
      jti: randomUUID(),
    });
  }
}

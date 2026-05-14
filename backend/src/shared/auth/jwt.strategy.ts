import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { TOKEN_BLOCKLIST } from "../constants/injection-tokens";
import { AccountId } from "../domain/value-objects/account-id";
import { UserId } from "../domain/value-objects/user-id";
import { Username } from "../domain/value-objects/username";
import type { CurrentUser } from "../http/decorators/current-user.decorator";
import type { TokenBlocklist } from "./token-blocklist";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(TOKEN_BLOCKLIST) private readonly tokenBlocklist: TokenBlocklist,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "supersecretjwtkey",
    });
  }

  async validate(payload: {
    sub: string;
    username: string;
    accountId: string;
    jti: string;
    exp: number;
  }): Promise<CurrentUser> {
    if (await this.tokenBlocklist.isBlocked(payload.jti)) {
      throw new UnauthorizedException("Token revogado.");
    }

    return {
      userId: new UserId(payload.sub),
      username: new Username(payload.username),
      accountId: new AccountId(payload.accountId),
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}

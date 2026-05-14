import { Inject, Injectable } from "@nestjs/common";
import { TOKEN_BLOCKLIST } from "../../../shared/constants/injection-tokens";
import type { TokenBlocklist } from "../../../shared/auth/token-blocklist";

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKEN_BLOCKLIST) private readonly tokenBlocklist: TokenBlocklist,
  ) {}

  async execute(input: { jti: string; expiresAt: number }): Promise<void> {
    const ttl = Math.max(
      input.expiresAt - Math.floor(Date.now() / 1000),
      1,
    );
    await this.tokenBlocklist.block(input.jti, ttl);
  }
}

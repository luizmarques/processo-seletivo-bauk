import { Inject, Injectable } from "@nestjs/common";
import {
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from "../../../shared/constants/injection-tokens";
import { AuthenticationError } from "../../../shared/domain/errors/domain.errors";
import { AccountId } from "../../wallet/domain/value-objects/account-id";
import { PasswordHash } from "../../../shared/domain/value-objects/password-hash";
import { PlainPassword } from "../../../shared/domain/value-objects/plain-password";
import { UserId } from "../../../shared/domain/value-objects/user-id";
import { Username } from "../../../shared/domain/value-objects/username";
import type { PasswordHasher } from "../../../shared/security/bcrypt-password.service";
import type { TokenService } from "../../../shared/security/jwt-token.service";
import type { UserRepository } from "../../users/domain/user.repository";

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(input: {
    username: string;
    password: string;
  }): Promise<{ accessToken: string }> {
    const username = new Username(input.username);
    const password = new PlainPassword(input.password);
    const user = await this.userRepository.findByUsername(username.toString());
    if (!user) {
      throw new AuthenticationError("Credenciais inválidas.");
    }

    const matches = await this.passwordHasher.compare(
      password,
      new PasswordHash(user.password),
    );
    if (!matches) {
      throw new AuthenticationError("Credenciais inválidas.");
    }

    const accessToken = await this.tokenService.sign({
      sub: new UserId(user.id),
      username: new Username(user.username),
      accountId: new AccountId(user.accountId),
    });

    return { accessToken };
  }
}

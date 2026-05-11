import { Inject, Injectable } from "@nestjs/common";
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
} from "../../../shared/constants/injection-tokens";
import { ResourceConflictError } from "../../../shared/domain/errors/domain.errors";
import { PlainPassword } from "../../../shared/domain/value-objects/plain-password";
import { Username } from "../../../shared/domain/value-objects/username";
import type { PasswordHasher } from "../../../shared/security/bcrypt-password.service";
import type { UserRepository } from "../domain/user.repository";

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: {
    username: string;
    password: string;
  }): Promise<{ id: string; username: string }> {
    const username = new Username(input.username);
    const password = new PlainPassword(input.password);
    const existingUser = await this.userRepository.findByUsername(
      username.toString(),
    );
    if (existingUser) {
      throw new ResourceConflictError("Username já utilizado.");
    }

    const hashedPassword = await this.passwordHasher.hash(password);
    const user = await this.userRepository.createWithAccount({
      username: username.toString(),
      password: hashedPassword.toString(),
    });

    return { id: user.id, username: user.username };
  }
}

import { Inject, Injectable } from "@nestjs/common";
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  DOMAIN_EVENT_PUBLISHER,
} from "../../../shared/constants/injection-tokens";
import { ResourceConflictError } from "../../../shared/domain/errors/domain.errors";
import type { DomainEventPublisher } from "../../../shared/domain/events/domain-event-publisher";
import { PlainPassword } from "../../../shared/domain/value-objects/plain-password";
import { Username } from "../../../shared/domain/value-objects/username";
import type { PasswordHasher } from "../../../shared/security/bcrypt-password.service";
import type { UserRepository } from "../domain/user.repository";

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
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

    await this.eventPublisher.publishAll(user.collectDomainEvents());

    return { id: user.id, username: user.username };
  }
}

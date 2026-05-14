import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { DomainEventHandler } from "../../../../shared/domain/events/domain-event-handler";
import { NestDomainEventPublisher } from "../../../../shared/events/nest-domain-event-publisher";
import { UserRegistered } from "../../domain/events/user-registered.event";

@Injectable()
export class UserRegisteredHandler
  implements DomainEventHandler<UserRegistered>, OnModuleInit
{
  readonly eventName = UserRegistered.EVENT_NAME;
  private readonly logger = new Logger(UserRegisteredHandler.name);

  constructor(private readonly publisher: NestDomainEventPublisher) {}

  onModuleInit(): void {
    this.publisher.register(this);
  }

  async handle(event: UserRegistered): Promise<void> {
    this.logger.log(
      `Usuário cadastrado — id: ${event.userId}, username: ${event.username}, ` +
        `conta: ${event.accountId}`,
    );
  }
}

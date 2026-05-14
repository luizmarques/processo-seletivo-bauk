import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { DomainEventHandler } from "../../../../shared/domain/events/domain-event-handler";
import { NestDomainEventPublisher } from "../../../../shared/events/nest-domain-event-publisher";
import { TransferExecuted } from "../../domain/events/transfer-executed.event";

@Injectable()
export class TransferAuditHandler
  implements DomainEventHandler<TransferExecuted>, OnModuleInit
{
  readonly eventName = TransferExecuted.EVENT_NAME;
  private readonly logger = new Logger(TransferAuditHandler.name);

  constructor(private readonly publisher: NestDomainEventPublisher) {}

  onModuleInit(): void {
    this.publisher.register(this);
  }

  async handle(event: TransferExecuted): Promise<void> {
    this.logger.log(
      `Transferência executada — id: ${event.transactionId}, ` +
        `de: ${event.senderAccountId}, para: ${event.recipientAccountId}, ` +
        `valor: ${event.amount}`,
    );
  }
}

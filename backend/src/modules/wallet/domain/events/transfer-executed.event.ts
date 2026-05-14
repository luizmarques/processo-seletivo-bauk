import { DomainEvent } from "../../../../shared/domain/events/domain-event";

export class TransferExecuted extends DomainEvent {
  static readonly EVENT_NAME = "transfer.executed";

  constructor(
    readonly transactionId: string,
    readonly senderAccountId: string,
    readonly recipientAccountId: string,
    readonly amount: string,
  ) {
    super();
  }

  get eventName(): string {
    return TransferExecuted.EVENT_NAME;
  }
}

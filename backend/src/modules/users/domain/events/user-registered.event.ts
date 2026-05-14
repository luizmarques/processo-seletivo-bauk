import { DomainEvent } from "../../../../shared/domain/events/domain-event";

export class UserRegistered extends DomainEvent {
  static readonly EVENT_NAME = "user.registered";

  constructor(
    readonly userId: string,
    readonly username: string,
    readonly accountId: string,
  ) {
    super();
  }

  get eventName(): string {
    return UserRegistered.EVENT_NAME;
  }
}

import type { DomainEvent } from "../domain/events/domain-event";
import type { DomainEventPublisher } from "../domain/events/domain-event-publisher";

export class NoopDomainEventPublisher implements DomainEventPublisher {
  async publish(_event: DomainEvent): Promise<void> {}
  async publishAll(_events: DomainEvent[]): Promise<void> {}
}

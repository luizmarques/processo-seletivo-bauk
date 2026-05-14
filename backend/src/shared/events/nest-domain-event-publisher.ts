import { Injectable } from "@nestjs/common";
import type { DomainEvent } from "../domain/events/domain-event";
import type { DomainEventHandler } from "../domain/events/domain-event-handler";
import type { DomainEventPublisher } from "../domain/events/domain-event-publisher";

@Injectable()
export class NestDomainEventPublisher implements DomainEventPublisher {
  private readonly handlers = new Map<string, DomainEventHandler[]>();

  register(handler: DomainEventHandler): void {
    const existing = this.handlers.get(handler.eventName) ?? [];
    this.handlers.set(handler.eventName, [...existing, handler]);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) ?? [];
    await Promise.all(handlers.map((h) => h.handle(event)));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((e) => this.publish(e)));
  }
}

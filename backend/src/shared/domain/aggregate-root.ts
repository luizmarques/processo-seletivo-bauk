import type { DomainEvent } from "./events/domain-event";

export abstract class AggregateRoot {
  // Não-enumerável para não interferir em comparações toEqual nos testes.
  private _domainEvents!: DomainEvent[];

  constructor() {
    Object.defineProperty(this, "_domainEvents", {
      value: [],
      enumerable: false,
      writable: true,
    });
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  collectDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;
    return events;
  }
}

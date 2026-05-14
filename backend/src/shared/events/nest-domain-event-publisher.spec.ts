import type { DomainEvent } from "../domain/events/domain-event";
import type { DomainEventHandler } from "../domain/events/domain-event-handler";
import { NestDomainEventPublisher } from "./nest-domain-event-publisher";

function makeEvent(name: string): DomainEvent {
  return { occurredAt: new Date(), eventName: name } as DomainEvent;
}

function makeHandler(
  name: string,
  collected: DomainEvent[],
): DomainEventHandler {
  return {
    eventName: name,
    handle: async (e) => {
      collected.push(e);
    },
  };
}

describe("NestDomainEventPublisher", () => {
  it("despacha evento para o handler registrado", async () => {
    const publisher = new NestDomainEventPublisher();
    const collected: DomainEvent[] = [];
    publisher.register(makeHandler("test.event", collected));

    const event = makeEvent("test.event");
    await publisher.publish(event);

    expect(collected).toHaveLength(1);
    expect(collected[0]).toBe(event);
  });

  it("nao lanca erro quando nenhum handler esta registrado para o evento", async () => {
    const publisher = new NestDomainEventPublisher();
    await expect(publisher.publish(makeEvent("unknown"))).resolves.not.toThrow();
  });

  it("despacha para multiplos handlers do mesmo evento", async () => {
    const publisher = new NestDomainEventPublisher();
    const first: DomainEvent[] = [];
    const second: DomainEvent[] = [];
    publisher.register(makeHandler("ev", first));
    publisher.register(makeHandler("ev", second));

    await publisher.publish(makeEvent("ev"));

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
  });

  it("publishAll despacha todos os eventos na ordem correta", async () => {
    const publisher = new NestDomainEventPublisher();
    const received: string[] = [];
    publisher.register({ eventName: "a", handle: async () => { received.push("a"); } });
    publisher.register({ eventName: "b", handle: async () => { received.push("b"); } });

    await publisher.publishAll([makeEvent("a"), makeEvent("b")]);

    expect(received).toEqual(["a", "b"]);
  });

  it("nao despacha evento de um tipo para handler de outro tipo", async () => {
    const publisher = new NestDomainEventPublisher();
    const collected: DomainEvent[] = [];
    publisher.register(makeHandler("ev.a", collected));

    await publisher.publish(makeEvent("ev.b"));

    expect(collected).toHaveLength(0);
  });
});

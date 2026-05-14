import { NestDomainEventPublisher } from "../../../../shared/events/nest-domain-event-publisher";
import { UserRegistered } from "../../domain/events/user-registered.event";
import { UserRegisteredHandler } from "./user-registered.handler";

describe("UserRegisteredHandler", () => {
  it("registra-se no publisher ao inicializar", () => {
    const publisher = new NestDomainEventPublisher();
    const registerSpy = jest.spyOn(publisher, "register");
    const handler = new UserRegisteredHandler(publisher);

    handler.onModuleInit();

    expect(registerSpy).toHaveBeenCalledWith(handler);
  });

  it("esta associado ao evento correto", () => {
    const publisher = new NestDomainEventPublisher();
    const handler = new UserRegisteredHandler(publisher);

    expect(handler.eventName).toBe(UserRegistered.EVENT_NAME);
  });

  it("trata o evento sem lancar erro", async () => {
    const publisher = new NestDomainEventPublisher();
    const handler = new UserRegisteredHandler(publisher);
    const event = new UserRegistered("user-1", "janedoe", "acc-1");

    await expect(handler.handle(event)).resolves.not.toThrow();
  });

  it("e invocado pelo publisher apos registro", async () => {
    const publisher = new NestDomainEventPublisher();
    const handler = new UserRegisteredHandler(publisher);
    handler.onModuleInit();

    const handleSpy = jest.spyOn(handler, "handle");
    const event = new UserRegistered("user-1", "janedoe", "acc-1");
    await publisher.publish(event);

    expect(handleSpy).toHaveBeenCalledWith(event);
  });
});

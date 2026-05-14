import { NestDomainEventPublisher } from "../../../../shared/events/nest-domain-event-publisher";
import { TransferExecuted } from "../../domain/events/transfer-executed.event";
import { TransferAuditHandler } from "./transfer-audit.handler";

describe("TransferAuditHandler", () => {
  it("registra-se no publisher ao inicializar", () => {
    const publisher = new NestDomainEventPublisher();
    const registerSpy = jest.spyOn(publisher, "register");
    const handler = new TransferAuditHandler(publisher);

    handler.onModuleInit();

    expect(registerSpy).toHaveBeenCalledWith(handler);
  });

  it("esta associado ao evento correto", () => {
    const publisher = new NestDomainEventPublisher();
    const handler = new TransferAuditHandler(publisher);

    expect(handler.eventName).toBe(TransferExecuted.EVENT_NAME);
  });

  it("trata o evento sem lancar erro", async () => {
    const publisher = new NestDomainEventPublisher();
    const handler = new TransferAuditHandler(publisher);
    const event = new TransferExecuted(
      "tx-1",
      "acc-sender",
      "acc-recipient",
      "10.0000",
    );

    await expect(handler.handle(event)).resolves.not.toThrow();
  });

  it("e invocado pelo publisher apos registro", async () => {
    const publisher = new NestDomainEventPublisher();
    const handler = new TransferAuditHandler(publisher);
    handler.onModuleInit();

    const handleSpy = jest.spyOn(handler, "handle");
    const event = new TransferExecuted("tx-1", "s", "r", "5.0000");
    await publisher.publish(event);

    expect(handleSpy).toHaveBeenCalledWith(event);
  });
});

import { ValidationDomainError } from "../../../shared/domain/errors/domain.errors";
import { TransferAmount } from "./value-objects/transfer-amount";
import { Account } from "./account";
import { TransferDomainService } from "./transfer.domain-service";

describe("TransferDomainService", () => {
  function makeService() {
    return new TransferDomainService();
  }

  it("debita remetente e credita destinatario pelo valor exato", () => {
    const service = makeService();
    const sender = Account.reconstitute("s", "100.0000");
    const recipient = Account.reconstitute("r", "50.0000");
    const amount = new TransferAmount("30.0000");

    service.execute(sender, recipient, amount);

    expect(sender.balance.toString()).toBe("70.0000");
    expect(recipient.balance.toString()).toBe("80.0000");
  });

  it("lanca erro e nao credita destinatario quando saldo insuficiente", () => {
    const service = makeService();
    const sender = Account.reconstitute("s", "10.0000");
    const recipient = Account.reconstitute("r", "50.0000");
    const amount = new TransferAmount("20.0000");

    expect(() => service.execute(sender, recipient, amount)).toThrow(
      ValidationDomainError,
    );
    expect(recipient.balance.toString()).toBe("50.0000");
  });

  it("permite transferencia usando todo o saldo disponivel", () => {
    const service = makeService();
    const sender = Account.reconstitute("s", "42.5000");
    const recipient = Account.reconstitute("r", "0.0000");
    const amount = new TransferAmount("42.5000");

    service.execute(sender, recipient, amount);

    expect(sender.balance.toString()).toBe("0.0000");
    expect(recipient.balance.toString()).toBe("42.5000");
  });
});

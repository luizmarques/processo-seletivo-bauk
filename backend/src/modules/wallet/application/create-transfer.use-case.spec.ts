import {
  ResourceNotFoundError,
  ValidationDomainError,
} from "../../../shared/domain/errors/domain.errors";
import { Account } from "../domain/account";
import type { DomainEvent } from "../../../shared/domain/events/domain-event";
import type { TransferAmount } from "../../../shared/domain/value-objects/transfer-amount";
import { User } from "../../users/domain/user";
import { CreateTransferUseCase } from "./create-transfer.use-case";

const senderUserId = "11111111-1111-4111-8111-111111111111";
const recipientUserId = "22222222-2222-4222-8222-222222222222";
const senderAccountId = "33333333-3333-4333-8333-333333333333";
const recipientAccountId = "44444444-4444-4444-8444-444444444444";

class FakeTransferUserRepository {
  public usersById = new Map<string, User>();
  public usersByUsername = new Map<string, User>();

  async findById(id: string) {
    return this.usersById.get(id) ?? null;
  }

  async findByUsername(username: string) {
    return this.usersByUsername.get(username) ?? null;
  }
}

class FakeTransactionRepository {
  public executeTransferCalls: Array<{
    senderAccountId: string;
    recipientAccountId: string;
    value: string;
  }> = [];
  public transactionId = "tx-1";
  public error: unknown;
  public senderBalance = "100.0000";

  async executeTransfer(
    _senderAccountId: string,
    _recipientAccountId: string,
    amount: TransferAmount,
    perform: (sender: Account, recipient: Account) => void,
  ) {
    if (this.error) throw this.error;

    // Simula o callback sendo chamado com os saldos armazenados; pode lançar ValidationDomainError.
    perform(
      Account.reconstitute(_senderAccountId, this.senderBalance),
      Account.reconstitute(_recipientAccountId, "50.0000"),
    );

    this.executeTransferCalls.push({
      senderAccountId: _senderAccountId,
      recipientAccountId: _recipientAccountId,
      value: amount.toString(),
    });

    return { id: this.transactionId, value: amount.toString() };
  }
}

class FakeDomainEventPublisher {
  public published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
}

describe("CreateTransferUseCase", () => {
  function createSut() {
    const userRepository = new FakeTransferUserRepository();
    const transactionRepository = new FakeTransactionRepository();
    const eventPublisher = new FakeDomainEventPublisher();

    userRepository.usersById.set(
      senderUserId,
      User.reconstitute(senderUserId, "janedoe", senderAccountId, ""),
    );
    userRepository.usersByUsername.set(
      "johndoe",
      User.reconstitute(recipientUserId, "johndoe", recipientAccountId, ""),
    );

    const sut = new CreateTransferUseCase(
      userRepository as never,
      transactionRepository as never,
      eventPublisher as never,
    );

    return { sut, userRepository, transactionRepository, eventPublisher };
  }

  it("transfere saldo em quatro casas e retorna valor arredondado ao usuario", async () => {
    const { sut, transactionRepository } = createSut();

    const result = await sut.execute({
      senderUserId,
      senderAccountId,
      recipientUsername: "johndoe",
      value: "10.9876",
    });

    expect(result).toEqual({ id: "tx-1", value: "10.99" });
    expect(transactionRepository.executeTransferCalls).toEqual([
      {
        senderAccountId,
        recipientAccountId,
        value: "10.9876",
      },
    ]);
  });

  it("publica evento TransferExecuted apos transferencia bem-sucedida", async () => {
    const { sut, eventPublisher } = createSut();

    await sut.execute({
      senderUserId,
      senderAccountId,
      recipientUsername: "johndoe",
      value: "10.0000",
    });

    expect(eventPublisher.published).toHaveLength(1);
    expect(eventPublisher.published[0].eventName).toBe("transfer.executed");
  });

  it("normaliza valor inteiro antes de enviar ao repositorio", async () => {
    const { sut, transactionRepository } = createSut();

    const result = await sut.execute({
      senderUserId,
      senderAccountId,
      recipientUsername: "johndoe",
      value: "10",
    });

    expect(result).toEqual({ id: "tx-1", value: "10.00" });
    expect(transactionRepository.executeTransferCalls[0]?.value).toBe(
      "10.0000",
    );
  });

  it("impede auto transferencia", async () => {
    const { sut, userRepository, transactionRepository } = createSut();
    userRepository.usersByUsername.set(
      "janedoe",
      User.reconstitute(senderUserId, "janedoe", senderAccountId, ""),
    );

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: "janedoe",
        value: "10.0000",
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ValidationDomainError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it("impede transferencia sem saldo", async () => {
    const { sut, transactionRepository } = createSut();
    transactionRepository.senderBalance = "5.0000";

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: "johndoe",
        value: "10.0000",
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ValidationDomainError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it("falha quando remetente nao existe", async () => {
    const { sut, userRepository, transactionRepository } = createSut();
    userRepository.usersById.clear();

    let error: unknown;
    try {
      await sut.execute({
        senderUserId: "55555555-5555-4555-8555-555555555555",
        senderAccountId,
        recipientUsername: "johndoe",
        value: "10.0000",
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it("falha quando destinatario nao existe", async () => {
    const { sut, userRepository, transactionRepository } = createSut();
    userRepository.usersByUsername.clear();

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: "ghost",
        value: "10.0000",
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it("falha quando uma conta nao existe na transferencia", async () => {
    const { sut, transactionRepository } = createSut();
    transactionRepository.error = new ResourceNotFoundError(
      "Conta não encontrada.",
    );

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: "johndoe",
        value: "10.0000",
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it("falha quando o valor e invalido sem consultar dependencias", async () => {
    const { sut, transactionRepository } = createSut();

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: "johndoe",
        value: "0.0000",
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ValidationDomainError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });
});

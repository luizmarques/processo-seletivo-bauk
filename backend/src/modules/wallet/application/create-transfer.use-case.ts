import { Inject, Injectable } from "@nestjs/common";
import {
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
  DOMAIN_EVENT_PUBLISHER,
} from "../../../shared/constants/injection-tokens";
import {
  ResourceNotFoundError,
  ValidationDomainError,
} from "../../../shared/domain/errors/domain.errors";
import type { DomainEventPublisher } from "../../../shared/domain/events/domain-event-publisher";
import { formatMoneyForDisplay } from "../../../shared/domain/value-objects/money-format";
import { TransferAmount } from "../../../shared/domain/value-objects/transfer-amount";
import { UserId } from "../../../shared/domain/value-objects/user-id";
import { Username } from "../../../shared/domain/value-objects/username";
import { TransferExecuted } from "../domain/events/transfer-executed.event";
import { TransferDomainService } from "../domain/transfer.domain-service";
import type { TransactionRepository } from "../domain/transaction.repository";
import type { UserRepository } from "../../users/domain/user.repository";

@Injectable()
export class CreateTransferUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
    private readonly transferDomainService: TransferDomainService,
  ) {}

  async execute(input: {
    senderUserId: string;
    senderAccountId: string;
    recipientUsername: string;
    value: string;
  }): Promise<{ id: string; value: string }> {
    const amount = new TransferAmount(input.value);
    const senderUserId = new UserId(input.senderUserId);
    const recipientUsername = new Username(input.recipientUsername);

    const sender = await this.userRepository.findById(senderUserId.toString());
    const recipient = await this.userRepository.findByUsername(
      recipientUsername.toString(),
    );

    if (!sender || !recipient) {
      throw new ResourceNotFoundError("Usuário não encontrado.");
    }

    if (sender.hasSameAccountAs(recipient)) {
      throw new ValidationDomainError(
        "Não é permitido transferir para a própria conta.",
      );
    }

    const transaction = await this.transactionRepository.executeTransfer(
      input.senderAccountId,
      recipient.accountId,
      amount,
      (senderAccount, recipientAccount) =>
        this.transferDomainService.execute(senderAccount, recipientAccount, amount),
    );

    await this.eventPublisher.publish(
      new TransferExecuted(
        transaction.id,
        input.senderAccountId,
        recipient.accountId,
        amount.toString(),
      ),
    );

    return {
      id: transaction.id,
      value: formatMoneyForDisplay(transaction.value),
    };
  }
}

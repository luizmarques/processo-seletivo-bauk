import { Inject, Injectable } from "@nestjs/common";
import {
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from "../../../shared/constants/injection-tokens";
import {
  ResourceNotFoundError,
  ValidationDomainError,
} from "../../../shared/domain/errors/domain.errors";
import { formatMoneyForDisplay } from "../../../shared/domain/value-objects/money-format";
import { TransferAmount } from "../../../shared/domain/value-objects/transfer-amount";
import { UserId } from "../../../shared/domain/value-objects/user-id";
import { Username } from "../../../shared/domain/value-objects/username";
import type { TransactionRepository } from "../domain/transaction.repository";
import type { UserRepository } from "../../users/domain/user.repository";

@Injectable()
export class CreateTransferUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
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
      (sender, recipient) => {
        sender.debit(amount);
        recipient.credit(amount);
      },
    );

    return {
      id: transaction.id,
      value: formatMoneyForDisplay(transaction.value),
    };
  }
}

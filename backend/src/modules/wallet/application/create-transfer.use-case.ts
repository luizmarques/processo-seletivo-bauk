import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTION_REPOSITORY, USER_REPOSITORY } from '../../../shared/constants/injection-tokens';
import { ResourceNotFoundError, ValidationDomainError } from '../../../shared/domain/errors/domain.errors';
import { AccountId } from '../../../shared/domain/value-objects/account-id';
import { formatMoneyForDisplay } from '../../../shared/domain/value-objects/money-format';
import { TransferAmount } from '../../../shared/domain/value-objects/transfer-amount';
import { UserId } from '../../../shared/domain/value-objects/user-id';
import { Username } from '../../../shared/domain/value-objects/username';
import type { UserRepository } from '../../users/domain/user.repository';
import type { TransactionRepository } from '../domain/transaction.repository';

@Injectable()
export class CreateTransferUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: {
    senderUserId: string;
    senderAccountId: string;
    recipientUsername: string;
    value: string;
  }): Promise<{ id: string; value: string }> {
    const senderUserId = new UserId(input.senderUserId);
    const senderAccountId = new AccountId(input.senderAccountId);
    const recipientUsername = new Username(input.recipientUsername);
    const amount = new TransferAmount(input.value);
    const sender = await this.userRepository.findById(senderUserId.toString());
    const recipient = await this.userRepository.findByUsername(recipientUsername.toString());

    if (!sender || !recipient) {
      throw new ResourceNotFoundError('Usuário não encontrado.');
    }
    const recipientAccountId = new AccountId(recipient.accountId);

    if (new AccountId(sender.accountId).equals(recipientAccountId)) {
      throw new ValidationDomainError('Não é permitido transferir para a própria conta.');
    }

    const transaction = await this.transactionRepository.executeTransfer({
      senderAccountId: senderAccountId.toString(),
      recipientAccountId: recipientAccountId.toString(),
      value: amount.toString(),
    });

    return { id: transaction.id, value: formatMoneyForDisplay(transaction.value) };
  }
}

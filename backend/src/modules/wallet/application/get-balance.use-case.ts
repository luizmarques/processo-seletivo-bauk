import { Inject, Injectable } from "@nestjs/common";
import { ACCOUNT_REPOSITORY } from "../../../shared/constants/injection-tokens";
import { ResourceNotFoundError } from "../../../shared/domain/errors/domain.errors";
import { AccountId } from "../../../shared/domain/value-objects/account-id";
import { Balance } from "../../../shared/domain/value-objects/balance";
import { formatMoneyForDisplay } from "../../../shared/domain/value-objects/money-format";
import type { AccountRepository } from "../domain/account.repository";

@Injectable()
export class GetBalanceUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(accountId: string): Promise<{ balance: string }> {
    const resolvedAccountId = new AccountId(accountId);
    const account = await this.accountRepository.findById(
      resolvedAccountId.toString(),
    );
    if (!account) {
      throw new ResourceNotFoundError("Conta não encontrada.");
    }
    return {
      balance: formatMoneyForDisplay(new Balance(account.balance).toString()),
    };
  }
}

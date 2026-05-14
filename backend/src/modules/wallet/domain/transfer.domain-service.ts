import { Injectable } from "@nestjs/common";
import type { TransferAmount } from "./value-objects/transfer-amount";
import type { Account } from "./account";

@Injectable()
export class TransferDomainService {
  execute(sender: Account, recipient: Account, amount: TransferAmount): void {
    sender.debit(amount);
    recipient.credit(amount);
  }
}

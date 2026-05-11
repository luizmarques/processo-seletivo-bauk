import { AccountEntity } from "../../../infrastructure/database/typeorm/entities/account.entity";

export interface AccountRepository {
  findById(id: string): Promise<AccountEntity | null>;
  save(account: AccountEntity): Promise<AccountEntity>;
}

import type { Account } from "./account";

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
}

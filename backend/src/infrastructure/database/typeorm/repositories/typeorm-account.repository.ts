import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account } from "../../../../modules/wallet/domain/account";
import { AccountEntity } from "../entities/account.entity";
import type { AccountRepository } from "../../../../modules/wallet/domain/account.repository";

@Injectable()
export class TypeOrmAccountRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repository: Repository<AccountEntity>,
  ) {}

  async findById(id: string): Promise<Account | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? new Account(entity.id, entity.balance) : null;
  }
}

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccountEntity } from "../entities/account.entity";
import type { AccountRepository } from "../../../../modules/wallet/domain/account.repository";

@Injectable()
export class TypeOrmAccountRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repository: Repository<AccountEntity>,
  ) {}

  findById(id: string): Promise<AccountEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  save(account: AccountEntity): Promise<AccountEntity> {
    return this.repository.save(account);
  }
}

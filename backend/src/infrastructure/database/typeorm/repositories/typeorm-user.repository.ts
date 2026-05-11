import { Injectable } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { InitialBalance } from "../../../../shared/domain/value-objects/initial-balance";
import { AccountEntity } from "../entities/account.entity";
import { UserEntity } from "../entities/user.entity";
import type { UserRepository } from "../../../../modules/users/domain/user.repository";

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  findById(id: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByUsername(username: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { username } });
  }

  async createWithAccount(input: {
    username: string;
    password: string;
  }): Promise<UserEntity> {
    return this.entityManager.transaction(async (manager) => {
      // O saldo inicial é regra obrigatória do domínio, não um dado variável do cadastro.
      const account = manager.create(AccountEntity, {
        balance: InitialBalance.create().toString(),
      });
      const savedAccount = await manager.save(account);

      const user = manager.create(UserEntity, {
        username: input.username,
        password: input.password,
        accountId: savedAccount.id,
      });

      return manager.save(user);
    });
  }

  count(): Promise<number> {
    return this.repository.count();
  }
}

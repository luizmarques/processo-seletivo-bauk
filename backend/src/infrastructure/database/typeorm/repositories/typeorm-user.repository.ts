import { Injectable } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { User } from "../../../../modules/users/domain/user";
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

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toUser(entity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { username } });
    return entity ? this.toUser(entity) : null;
  }

  async createWithAccount(input: {
    username: string;
    password: string;
  }): Promise<User> {
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

      const savedUser = await manager.save(user);
      return User.register(savedUser.id, savedUser.username, savedAccount.id, savedUser.password);
    });
  }

  count(): Promise<number> {
    return this.repository.count();
  }

  private toUser(entity: UserEntity): User {
    return User.reconstitute(entity.id, entity.username, entity.accountId, entity.password);
  }
}

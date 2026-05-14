import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { User } from "../../../../modules/users/domain/user";
import { InitialBalance } from "../../../../modules/wallet/domain/value-objects/initial-balance";
import type { UserRepository } from "../../../../modules/users/domain/user.repository";
import { InMemoryStore } from "../in-memory-store";

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findById(id: string): Promise<User | null> {
    return this.store.users.get(id) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const userId = this.store.usernameIndex.get(username);
    if (!userId) return null;
    return this.store.users.get(userId) ?? null;
  }

  async createWithAccount(input: {
    username: string;
    password: string;
  }): Promise<User> {
    const accountId = randomUUID();
    const userId = randomUUID();

    this.store.accounts.set(accountId, {
      id: accountId,
      balance: InitialBalance.create().toString(),
      userId,
    });

    const user = User.register(userId, input.username, accountId, input.password);
    this.store.users.set(userId, user);
    this.store.usernameIndex.set(input.username, userId);

    return user;
  }

  async count(): Promise<number> {
    return this.store.users.size;
  }
}

import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { UserRegistered } from "./events/user-registered.event";

export class User extends AggregateRoot {
  private constructor(
    readonly id: string,
    readonly username: string,
    readonly accountId: string,
    readonly password: string,
  ) {
    super();
  }

  static register(
    id: string,
    username: string,
    accountId: string,
    password: string,
  ): User {
    const user = new User(id, username, accountId, password);
    user.addDomainEvent(new UserRegistered(id, username, accountId));
    return user;
  }

  static reconstitute(
    id: string,
    username: string,
    accountId: string,
    password: string,
  ): User {
    return new User(id, username, accountId, password);
  }

  hasSameAccountAs(other: User): boolean {
    return this.accountId === other.accountId;
  }
}

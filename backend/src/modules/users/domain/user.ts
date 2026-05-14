export class User {
  private constructor(
    readonly id: string,
    readonly username: string,
    readonly accountId: string,
    readonly password: string,
  ) {}

  static register(
    id: string,
    username: string,
    accountId: string,
    password: string,
  ): User {
    return new User(id, username, accountId, password);
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

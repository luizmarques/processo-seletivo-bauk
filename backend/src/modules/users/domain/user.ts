export class User {
  constructor(
    readonly id: string,
    readonly username: string,
    readonly accountId: string,
    readonly password: string,
  ) {}

  hasSameAccountAs(other: User): boolean {
    return this.accountId === other.accountId;
  }
}

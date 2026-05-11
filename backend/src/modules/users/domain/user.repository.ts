import type { User } from "./user";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  createWithAccount(input: {
    username: string;
    password: string;
  }): Promise<User>;
  count(): Promise<number>;
}

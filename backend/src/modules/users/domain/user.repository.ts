import { UserEntity } from '../../../infrastructure/database/typeorm/entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  createWithAccount(input: { username: string; password: string }): Promise<UserEntity>;
  count(): Promise<number>;
}

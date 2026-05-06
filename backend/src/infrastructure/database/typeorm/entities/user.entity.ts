import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity } from './account.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column()
  password!: string;

  @Column({ name: 'account_id' })
  accountId!: string;

  @OneToOne(() => AccountEntity, (account) => account.user, { eager: true })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;
}


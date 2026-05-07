import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { REQUIRED_INITIAL_BALANCE } from '../../../../shared/domain/value-objects/initial-balance';
import { TransactionEntity } from './transaction.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'accounts' })
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4, default: REQUIRED_INITIAL_BALANCE })
  balance!: string;

  @OneToOne(() => UserEntity, (user) => user.account)
  user!: UserEntity;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.debitedAccount)
  outgoingTransactions!: TransactionEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.creditedAccount)
  incomingTransactions!: TransactionEntity[];
}

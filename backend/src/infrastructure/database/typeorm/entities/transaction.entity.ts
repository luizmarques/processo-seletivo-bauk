import { CreateDateColumn, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity } from './account.entity';

@Entity({ name: 'transactions' })
@Index(['debitedAccountId', 'createdAt'])
@Index(['creditedAccountId', 'createdAt'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'debited_account_id' })
  debitedAccountId!: string;

  @Column({ name: 'credited_account_id' })
  creditedAccountId!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4 })
  value!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, (account) => account.outgoingTransactions)
  @JoinColumn({ name: 'debited_account_id' })
  debitedAccount!: AccountEntity;

  @ManyToOne(() => AccountEntity, (account) => account.incomingTransactions)
  @JoinColumn({ name: 'credited_account_id' })
  creditedAccount!: AccountEntity;
}

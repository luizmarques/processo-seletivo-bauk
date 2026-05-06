import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from './infrastructure/database/typeorm/entities/account.entity';
import { TransactionEntity } from './infrastructure/database/typeorm/entities/transaction.entity';
import { UserEntity } from './infrastructure/database/typeorm/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RedisModule } from './shared/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      username: process.env.POSTGRES_USER ?? 'bauk',
      password: process.env.POSTGRES_PASSWORD ?? 'bauk',
      database: process.env.POSTGRES_DB ?? 'bauk',
      entities: [UserEntity, AccountEntity, TransactionEntity],
      migrations: ['dist/infrastructure/database/typeorm/migrations/*.js'],
      synchronize: false,
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    WalletModule,
  ],
})
export class AppModule {}

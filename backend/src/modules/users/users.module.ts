import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountEntity } from "../../infrastructure/database/typeorm/entities/account.entity";
import { UserEntity } from "../../infrastructure/database/typeorm/entities/user.entity";
import { TypeOrmUserRepository } from "../../infrastructure/database/typeorm/repositories/typeorm-user.repository";
import {
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from "../../shared/constants/injection-tokens";
import { BcryptPasswordService } from "../../shared/security/bcrypt-password.service";
import { RegisterUserUseCase } from "./application/register-user.use-case";
import { UserRegisteredHandler } from "./application/handlers/user-registered.handler";
import { UsersController } from "./users.controller";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AccountEntity])],
  controllers: [UsersController],
  providers: [
    RegisterUserUseCase,
    UserRegisteredHandler,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordService },
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER],
})
export class UsersModule {}

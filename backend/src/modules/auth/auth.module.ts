import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { LoginUseCase } from "./application/login.use-case";
import { LogoutUseCase } from "./application/logout.use-case";
import { UsersModule } from "../users/users.module";
import { TOKEN_SERVICE } from "../../shared/constants/injection-tokens";
import { JwtTokenService } from "../../shared/security/jwt-token.service";
import { JwtStrategy } from "../../shared/auth/jwt.strategy";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "supersecretjwtkey",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "24h" },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    LogoutUseCase,
    JwtStrategy,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class AuthModule {}

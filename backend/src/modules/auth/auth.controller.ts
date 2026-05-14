import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUserDecorator } from "../../shared/http/decorators/current-user.decorator";
import type { CurrentUser } from "../../shared/http/decorators/current-user.decorator";
import { requestValidationOptions } from "../../shared/http/pipes/request-validation-options";
import { LoginUseCase } from "./application/login.use-case";
import { LogoutUseCase } from "./application/logout.use-case";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary: "Autentica um usuário e retorna um JWT válido por 24 horas.",
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: "Login realizado com sucesso.",
    schema: {
      example: {
        accessToken: "jwt.token.exemplo",
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Credenciais inválidas." })
  login(
    @Body(new ValidationPipe(requestValidationOptions)) body: LoginDto,
  ): Promise<{ accessToken: string }> {
    return this.loginUseCase.execute(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({
    summary: "Invalida o token JWT no servidor e encerra a sessão.",
  })
  @ApiOkResponse({
    description: "Logout realizado com sucesso.",
    schema: { example: { message: "Logout realizado com sucesso." } },
  })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  async logout(
    @CurrentUserDecorator() currentUser: CurrentUser,
  ): Promise<{ message: string }> {
    await this.logoutUseCase.execute({
      jti: currentUser.jti,
      expiresAt: currentUser.exp,
    });
    return { message: "Logout realizado com sucesso." };
  }
}

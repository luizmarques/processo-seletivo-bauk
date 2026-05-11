import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
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
import { requestValidationOptions } from "../../shared/http/pipes/request-validation-options";
import { LoginUseCase } from "./application/login.use-case";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

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
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({
    summary:
      "Encerra a sessão no cliente. O backend retorna apenas uma mensagem informativa.",
  })
  @ApiOkResponse({
    description: "Logout informado com sucesso.",
    schema: {
      example: {
        message: "Logout realizado no cliente com remocao do token.",
      },
    },
  })
  logout(): { message: string } {
    return { message: "Logout realizado no cliente com remocao do token." };
  }
}

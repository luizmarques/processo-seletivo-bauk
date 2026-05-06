import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { requestValidationOptions } from '../../shared/http/pipes/request-validation-options';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { RegisterUserDto } from './dto/register-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um novo usuário com conta e saldo inicial.' })
  @ApiBody({ type: RegisterUserDto })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso.',
    schema: {
      example: {
        id: '11111111-1111-4111-8111-111111111111',
        username: 'janedoe',
      },
    },
  })
  @ApiConflictResponse({ description: 'Username já utilizado.' })
  register(@Body(new ValidationPipe(requestValidationOptions)) body: RegisterUserDto): Promise<{ id: string; username: string }> {
    return this.registerUserUseCase.execute(body);
  }
}

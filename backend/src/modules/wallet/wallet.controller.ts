import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserDecorator, type CurrentUser } from '../../shared/http/decorators/current-user.decorator';
import { IdempotencyInterceptor } from '../../shared/http/interceptors/idempotency.interceptor';
import { requestValidationOptions } from '../../shared/http/pipes/request-validation-options';
import { TransactionsFilterPipe } from '../../shared/http/pipes/transactions-filter.pipe';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { CreateTransferUseCase } from './application/create-transfer.use-case';
import { GetBalanceUseCase } from './application/get-balance.use-case';
import { ListTransactionsUseCase } from './application/list-transactions.use-case';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly getBalanceUseCase: GetBalanceUseCase,
    private readonly createTransferUseCase: CreateTransferUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Obtém o saldo atual da conta autenticada.' })
  @ApiOkResponse({
    description: 'Saldo retornado com sucesso.',
    schema: {
      example: {
        balance: '100.00',
      },
    },
  })
  balance(@CurrentUserDecorator() user: CurrentUser): Promise<{ balance: string }> {
    return this.getBalanceUseCase.execute(user.accountId.toString());
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Realiza uma transferência interna entre usuários.' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Chave composta gerada pelo frontend no formato usuario:receptor:valor:bucket-temporal.',
    schema: {
      type: 'string',
      example: 'janedoe:johndoe:10.0000:352516106',
    },
  })
  @ApiCreatedResponse({
    description: 'Transferência realizada com sucesso.',
    schema: {
      example: {
        id: '0d5cb73f-2199-40f7-813b-8ac93acc7636',
        value: '1.00',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido, valor inválido ou ausência da Idempotency-Key.',
  })
  @ApiConflictResponse({
    description: 'A mesma Idempotency-Key já foi usada dentro da janela de proteção.',
  })
  @ApiForbiddenResponse({ description: 'Usuário autenticado não pode transferir para si mesmo.' })
  @UseInterceptors(IdempotencyInterceptor)
  transfer(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ValidationPipe(requestValidationOptions)) body: CreateTransferDto,
  ): Promise<{ id: string; value: string }> {
    return this.createTransferUseCase.execute({
      senderUserId: user.userId.toString(),
      senderAccountId: user.accountId.toString(),
      recipientUsername: body.username,
      value: body.value,
    });
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Lista transações da conta autenticada com paginação, filtros e ordenação.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'type', required: false, enum: ['cash-in', 'cash-out'] })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-05-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-05-31' })
  @ApiOkResponse({
    description: 'Histórico paginado retornado com sucesso.',
    schema: {
      example: {
        data: [
          {
            id: '0d5cb73f-2199-40f7-813b-8ac93acc7636',
            debitedAccountId: 'acc-1',
            debitedUsername: 'janedoe',
            creditedAccountId: 'acc-2',
            creditedUsername: 'johndoe',
            value: '1.00',
            createdAt: '2026-05-06T18:14:17.000Z',
            type: 'cash-out',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Filtros inválidos, como datas inconsistentes ou paginação fora da faixa.' })
  transactions(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(TransactionsFilterPipe) query: ListTransactionsDto,
  ): Promise<{
    data: Array<{
      id: string;
      debitedAccountId: string;
      debitedUsername: string;
      creditedAccountId: string;
      creditedUsername: string;
      value: string;
      createdAt: Date;
      type: 'cash-in' | 'cash-out';
    }>;
    meta: { total: number; page: number; limit: number };
  }> {
    return this.listTransactionsUseCase.execute({ accountId: user.accountId.toString(), ...query });
  }
}

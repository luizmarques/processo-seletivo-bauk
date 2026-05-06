import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { TransferAmountPipe } from '../../../shared/http/pipes/transfer-amount.pipe';

export class CreateTransferDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Username do destinatário. O valor é normalizado para minúsculas.',
  })
  @IsString()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  username!: string;

  @ApiProperty({
    example: '10.9876',
    description: 'Valor decimal positivo com até 4 casas decimais.',
  })
  @IsString()
  @Transform(({ value }) => new TransferAmountPipe().transform(String(value).trim()))
  value!: string;
}

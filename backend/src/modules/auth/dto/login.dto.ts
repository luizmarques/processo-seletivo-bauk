import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'janedoe',
    description: 'Username do usuário em minúsculas. Espaços extras são removidos automaticamente.',
  })
  @IsString()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  username!: string;

  @ApiProperty({
    example: 'Senha123',
    description: 'Senha com no mínimo 8 caracteres.',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

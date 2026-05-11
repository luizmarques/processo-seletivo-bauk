import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class RegisterUserDto {
  @ApiProperty({
    example: "janedoe",
    description:
      "Username único com no mínimo 3 caracteres. O valor é normalizado para minúsculas.",
  })
  @IsString()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @MinLength(3)
  username!: string;

  @ApiProperty({
    example: "Senha123",
    description:
      "Senha com no mínimo 8 caracteres, 1 letra maiúscula e 1 número.",
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: "A senha deve conter ao menos uma letra maiúscula e um número.",
  })
  password!: string;
}

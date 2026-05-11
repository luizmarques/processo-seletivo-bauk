import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";

export class ListTransactionsDto {
  @ApiPropertyOptional({
    example: "2026-05-01",
    description: "Data inicial no formato ISO (YYYY-MM-DD).",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: "2026-05-31",
    description: "Data final no formato ISO (YYYY-MM-DD).",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: ["cash-in", "cash-out"],
    description: "Filtra transações por entrada ou saída.",
  })
  @IsOptional()
  @IsIn(["cash-in", "cash-out"])
  type?: "cash-in" | "cash-out";

  @ApiPropertyOptional({
    enum: ["ASC", "DESC"],
    default: "DESC",
    description: "Ordenação por data de criação.",
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  order?: "ASC" | "DESC";

  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: "Página da consulta.",
  })
  @Transform(({ value }) => Number(value ?? 1))
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    maximum: 50,
    description: "Itens por página, máximo 50.",
  })
  @Transform(({ value }) => Number(value ?? 10))
  @IsPositive()
  @Max(50)
  limit = 10;
}

import { MigrationInterface, QueryRunner } from "typeorm";

const INITIAL_BALANCE_DEFAULT = "100.0000";

export class ExpandMoneyScale1715000000001 implements MigrationInterface {
  name = "ExpandMoneyScale1715000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "balance" TYPE numeric(18,4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "balance" SET DEFAULT '${INITIAL_BALANCE_DEFAULT}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "value" TYPE numeric(18,4)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "value" TYPE numeric(18,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "balance" TYPE numeric(18,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "balance" SET DEFAULT '100.00'`,
    );
  }
}

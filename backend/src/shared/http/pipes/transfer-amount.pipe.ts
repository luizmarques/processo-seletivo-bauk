import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { TransferAmount } from "../../../modules/wallet/domain/value-objects/transfer-amount";

const AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;

@Injectable()
export class TransferAmountPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    try {
      if (!AMOUNT_PATTERN.test(value)) {
        throw new Error("invalid-format");
      }
      return new TransferAmount(value).toString();
    } catch {
      throw new BadRequestException(
        "O valor deve ser decimal com até 4 casas e maior que zero.",
      );
    }
  }
}

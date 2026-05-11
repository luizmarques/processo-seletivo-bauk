import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ListTransactionsDto } from "../../../modules/wallet/dto/list-transactions.dto";

@Injectable()
export class TransactionsFilterPipe implements PipeTransform<
  ListTransactionsDto,
  ListTransactionsDto
> {
  transform(value: ListTransactionsDto): ListTransactionsDto {
    if (value.startDate && value.endDate) {
      const startDate = new Date(value.startDate);
      const endDate = new Date(value.endDate);

      if (startDate.getTime() > endDate.getTime()) {
        throw new BadRequestException(
          "A data inicial não pode ser maior que a data final.",
        );
      }
    }

    return value;
  }
}

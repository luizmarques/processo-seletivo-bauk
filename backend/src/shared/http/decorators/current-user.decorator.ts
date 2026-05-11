import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AccountId } from "../../domain/value-objects/account-id";
import { UserId } from "../../domain/value-objects/user-id";
import { Username } from "../../domain/value-objects/username";

export interface CurrentUser {
  userId: UserId;
  username: Username;
  accountId: AccountId;
}

export const CurrentUserDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser =>
    ctx.switchToHttp().getRequest().user,
);

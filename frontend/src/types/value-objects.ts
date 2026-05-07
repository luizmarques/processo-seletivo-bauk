export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export type ApiUrl = Brand<string, 'ApiUrl'>;
export type JwtToken = Brand<string, 'JwtToken'>;
export type Username = Brand<string, 'Username'>;
export type Password = Brand<string, 'Password'>;
export type FeedbackMessage = Brand<string, 'FeedbackMessage'>;
export type MoneyAmount = Brand<string, 'MoneyAmount'>;
export type IdempotencyKey = Brand<string, 'IdempotencyKey'>;
export type EntityId = Brand<string, 'EntityId'>;
export type AccountId = Brand<string, 'AccountId'>;
export type ISODateString = Brand<string, 'ISODateString'>;
export type TimeComponent = Brand<string, 'TimeComponent'>;
export type PageNumber = Brand<number, 'PageNumber'>;
export type PageSize = Brand<number, 'PageSize'>;
export type TotalItems = Brand<number, 'TotalItems'>;

export function toApiUrl(value: string): ApiUrl {
  return value as ApiUrl;
}

export function toJwtToken(value: string): JwtToken {
  return value as JwtToken;
}

export function toUsername(value: string): Username {
  return value as Username;
}

export function toPassword(value: string): Password {
  return value as Password;
}

export function toFeedbackMessage(value: string): FeedbackMessage {
  return value as FeedbackMessage;
}

export function toMoneyAmount(value: string): MoneyAmount {
  return value as MoneyAmount;
}

export function toIdempotencyKey(value: string): IdempotencyKey {
  return value as IdempotencyKey;
}

export function toEntityId(value: string): EntityId {
  return value as EntityId;
}

export function toAccountId(value: string): AccountId {
  return value as AccountId;
}

export function toISODateString(value: string): ISODateString {
  return value as ISODateString;
}

export function toTimeComponent(value: string): TimeComponent {
  return value as TimeComponent;
}

export function toPageNumber(value: number): PageNumber {
  return value as PageNumber;
}

export function toPageSize(value: number): PageSize {
  return value as PageSize;
}

export function toTotalItems(value: number): TotalItems {
  return value as TotalItems;
}

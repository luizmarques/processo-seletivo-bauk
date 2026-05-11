export interface IdempotencyStore {
  get(key: string): Promise<string | null>;
  setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

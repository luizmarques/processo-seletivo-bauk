export interface TokenBlocklist {
  block(jti: string, ttlSeconds: number): Promise<void>;
  isBlocked(jti: string): Promise<boolean>;
}

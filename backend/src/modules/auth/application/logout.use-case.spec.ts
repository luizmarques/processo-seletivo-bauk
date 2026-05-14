import type { TokenBlocklist } from "../../../shared/auth/token-blocklist";
import { LogoutUseCase } from "./logout.use-case";

class FakeTokenBlocklist implements TokenBlocklist {
  public blocked = new Map<string, number>();

  async block(jti: string, ttlSeconds: number): Promise<void> {
    this.blocked.set(jti, ttlSeconds);
  }

  async isBlocked(jti: string): Promise<boolean> {
    return this.blocked.has(jti);
  }
}

describe("LogoutUseCase", () => {
  function createSut() {
    const blocklist = new FakeTokenBlocklist();
    const sut = new LogoutUseCase(blocklist as never);
    return { sut, blocklist };
  }

  it("adiciona o jti a blocklist com o ttl restante do token", async () => {
    const { sut, blocklist } = createSut();
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    await sut.execute({ jti: "jti-abc", expiresAt });

    expect(blocklist.blocked.has("jti-abc")).toBe(true);
    const ttl = blocklist.blocked.get("jti-abc")!;
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(3600);
  });

  it("usa ttl minimo de 1 segundo para tokens ja expirados ou no limite", async () => {
    const { sut, blocklist } = createSut();
    const expiresAt = Math.floor(Date.now() / 1000) - 60;

    await sut.execute({ jti: "jti-expired", expiresAt });

    expect(blocklist.blocked.get("jti-expired")).toBe(1);
  });

  it("bloqueia tokens distintos de forma independente", async () => {
    const { sut, blocklist } = createSut();
    const exp = Math.floor(Date.now() / 1000) + 1800;

    await sut.execute({ jti: "jti-1", expiresAt: exp });
    await sut.execute({ jti: "jti-2", expiresAt: exp });

    expect(blocklist.blocked.has("jti-1")).toBe(true);
    expect(blocklist.blocked.has("jti-2")).toBe(true);
  });
});

import { describe, expect, it, vi, afterEach } from "vitest";
import { buildTransferIdempotencyKey } from "./idempotency";
import { toUsername, toMoneyAmount } from "../types/value-objects";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildTransferIdempotencyKey", () => {
  it("gera chave composta com sender, recipient, valor e janela de tempo", () => {
    const key = buildTransferIdempotencyKey({
      senderUsername: toUsername("janedoe"),
      recipientUsername: toUsername("johndoe"),
      value: toMoneyAmount("10.00"),
      time: "10",
    });
    expect(key).toBe("janedoe:johndoe:10.0000:10");
  });

  it("normaliza sender e recipient para lowercase", () => {
    const key = buildTransferIdempotencyKey({
      senderUsername: toUsername("JaneDoe"),
      recipientUsername: toUsername("JohnDoe"),
      value: toMoneyAmount("10.00"),
      time: "10",
    });
    expect(key).toBe("janedoe:johndoe:10.0000:10");
  });

  it("normaliza valor inteiro para quatro casas decimais", () => {
    const key = buildTransferIdempotencyKey({
      senderUsername: toUsername("janedoe"),
      recipientUsername: toUsername("johndoe"),
      value: toMoneyAmount("10"),
      time: "10",
    });
    expect(key).toBe("janedoe:johndoe:10.0000:10");
  });

  it("usa VITE_IDEMPOTENCY_TIME quando time nao e informado", () => {
    vi.stubEnv("VITE_IDEMPOTENCY_TIME", "30");
    const key = buildTransferIdempotencyKey({
      senderUsername: toUsername("janedoe"),
      recipientUsername: toUsername("johndoe"),
      value: toMoneyAmount("10.00"),
    });
    expect(key).toBe("janedoe:johndoe:10.0000:30");
  });

  it("usa janela padrao de 10 quando nenhum env esta configurado", () => {
    const key = buildTransferIdempotencyKey({
      senderUsername: toUsername("janedoe"),
      recipientUsername: toUsername("johndoe"),
      value: toMoneyAmount("10.00"),
    });
    expect(key).toMatch(/^janedoe:johndoe:10\.0000:10$/);
  });

  it("gera a mesma chave para a mesma operacao na mesma janela", () => {
    const input = {
      senderUsername: toUsername("janedoe"),
      recipientUsername: toUsername("johndoe"),
      value: toMoneyAmount("10.00"),
      time: "10",
    };
    expect(buildTransferIdempotencyKey(input)).toBe(buildTransferIdempotencyKey(input));
  });
});

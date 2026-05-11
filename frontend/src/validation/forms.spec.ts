import { describe, expect, it } from "vitest";
import {
  getFirstValidationMessage,
  loginFormSchema,
  registerFormSchema,
  transferFormSchema,
} from "./forms";

describe("loginFormSchema", () => {
  it("aceita credenciais validas e normaliza username", () => {
    const result = loginFormSchema.safeParse({ username: " JaneDoe ", password: "Senha123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.username).toBe("janedoe");
  });

  it("rejeita username com menos de 3 caracteres", () => {
    expect(loginFormSchema.safeParse({ username: "ab", password: "Senha123" }).success).toBe(false);
  });

  it("rejeita senha sem maiuscula", () => {
    expect(loginFormSchema.safeParse({ username: "janedoe", password: "senha123" }).success).toBe(false);
  });

  it("rejeita senha sem numero", () => {
    expect(loginFormSchema.safeParse({ username: "janedoe", password: "Senhasemnumero" }).success).toBe(false);
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    expect(loginFormSchema.safeParse({ username: "janedoe", password: "Ab1!" }).success).toBe(false);
  });
});

describe("registerFormSchema", () => {
  it("aceita cadastro valido", () => {
    expect(registerFormSchema.safeParse({ username: "janedoe", password: "Senha123" }).success).toBe(true);
  });

  it("rejeita username curto", () => {
    expect(registerFormSchema.safeParse({ username: "ab", password: "Senha123" }).success).toBe(false);
  });
});

describe("transferFormSchema", () => {
  it("aceita transferencia valida", () => {
    const result = transferFormSchema.safeParse({
      recipientUsername: "johndoe",
      transferAmount: 10.5,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita valor zero", () => {
    expect(
      transferFormSchema.safeParse({ recipientUsername: "johndoe", transferAmount: 0 }).success,
    ).toBe(false);
  });

  it("rejeita valor negativo", () => {
    expect(
      transferFormSchema.safeParse({ recipientUsername: "johndoe", transferAmount: -1 }).success,
    ).toBe(false);
  });

  it("rejeita mais de 2 casas decimais", () => {
    expect(
      transferFormSchema.safeParse({ recipientUsername: "johndoe", transferAmount: 10.999 }).success,
    ).toBe(false);
  });

  it("rejeita transferencia para o proprio usuario", () => {
    const result = transferFormSchema.safeParse({
      recipientUsername: "janedoe",
      transferAmount: 10,
      currentUsername: "janedoe",
    });
    expect(result.success).toBe(false);
  });

  it("permite transferencia quando currentUsername nao e informado", () => {
    expect(
      transferFormSchema.safeParse({ recipientUsername: "janedoe", transferAmount: 10 }).success,
    ).toBe(true);
  });

  it("normaliza recipientUsername antes de comparar com currentUsername", () => {
    const result = transferFormSchema.safeParse({
      recipientUsername: " JaneDoe ",
      transferAmount: 10,
      currentUsername: "janedoe",
    });
    expect(result.success).toBe(false);
  });
});

describe("getFirstValidationMessage", () => {
  it("retorna a mensagem do primeiro erro", () => {
    const result = loginFormSchema.safeParse({ username: "ab", password: "Senha123" });
    if (!result.success) {
      expect(getFirstValidationMessage(result.error)).toBe(
        "O username deve possuir ao menos 3 caracteres.",
      );
    }
  });

  it("retorna mensagem padrao quando nao ha issues", () => {
    const fakeError = { issues: [] } as never;
    expect(getFirstValidationMessage(fakeError)).toBe("Os dados informados são inválidos.");
  });
});

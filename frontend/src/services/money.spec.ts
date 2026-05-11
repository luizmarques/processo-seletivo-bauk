import { describe, expect, it } from "vitest";
import { formatMoneyForDisplay, normalizeMoneyInput } from "./money";

describe("normalizeMoneyInput", () => {
  it("normaliza inteiro para quatro casas decimais", () => {
    expect(normalizeMoneyInput("10")).toBe("10.0000");
  });

  it("normaliza valor com menos de quatro casas", () => {
    expect(normalizeMoneyInput("10.5")).toBe("10.5000");
    expect(normalizeMoneyInput("10.12")).toBe("10.1200");
  });

  it("preserva quatro casas decimais sem alteracao", () => {
    expect(normalizeMoneyInput("10.9876")).toBe("10.9876");
  });

  it("troca virgula por ponto", () => {
    expect(normalizeMoneyInput("10,50")).toBe("10.5000");
  });

  it("remove espacos nas bordas", () => {
    expect(normalizeMoneyInput("  10  ")).toBe("10.0000");
  });

  it("retorna o valor original quando o formato e invalido", () => {
    expect(normalizeMoneyInput("abc")).toBe("abc");
  });
});

describe("formatMoneyForDisplay", () => {
  it("formata valor com quatro casas para duas", () => {
    expect(formatMoneyForDisplay("10.0000")).toBe("10.00");
    expect(formatMoneyForDisplay("100.5000")).toBe("100.50");
  });

  it("aplica arredondamento bancario — meio arredonda para par", () => {
    expect(formatMoneyForDisplay("2.3450")).toBe("2.34"); // 34 é par → não arredonda
    expect(formatMoneyForDisplay("2.3550")).toBe("2.36"); // 35 é ímpar → arredonda
  });

  it("arredonda para cima quando descarte > 50", () => {
    expect(formatMoneyForDisplay("2.3460")).toBe("2.35");
  });

  it("nao arredonda quando descarte < 50", () => {
    expect(formatMoneyForDisplay("2.3449")).toBe("2.34");
  });

  it("aceita numero diretamente", () => {
    expect(formatMoneyForDisplay(10)).toBe("10.00");
  });

  it("retorna o valor original quando o formato e invalido", () => {
    expect(formatMoneyForDisplay("abc" as never)).toBe("abc");
  });
});

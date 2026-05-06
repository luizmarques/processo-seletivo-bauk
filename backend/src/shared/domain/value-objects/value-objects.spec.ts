import { ValidationDomainError } from '../errors/domain.errors';
import { AccountId } from './account-id';
import { Balance } from './balance';
import { Money } from './money';
import { PasswordHash } from './password-hash';
import { PlainPassword } from './plain-password';
import { TransferAmount } from './transfer-amount';
import { UserId } from './user-id';
import { Username } from './username';
import { IdempotencyKey } from '../../http/idempotency-key';

describe('Value Objects', () => {
  it('normaliza username e compara igualdade', () => {
    const username = new Username(' JaneDoe ');
    const otherUsername = new Username('janedoe');

    expect(username.toString()).toBe('janedoe');
    expect(username.equals(otherUsername)).toBe(true);
  });

  it('recusa username invalido', () => {
    expect(() => new Username('ab')).toThrow(ValidationDomainError);
  });

  it('bloqueia usernames iguais quando a regra exige diferenca', () => {
    const username = new Username('janedoe');
    const sameUsername = new Username('JANEDOE');

    expect(() => username.ensureDifferentFrom(sameUsername)).toThrow('Username deve ser diferente.');
  });

  it('aceita senha valida e recusa senha invalida', () => {
    expect(new PlainPassword('Senha123').toString()).toBe('Senha123');
    expect(() => new PlainPassword('senha')).toThrow(ValidationDomainError);
  });

  it('recusa senha sem numero ou sem maiuscula mesmo com tamanho suficiente', () => {
    expect(() => new PlainPassword('Senhasemnumero')).toThrow(ValidationDomainError);
    expect(() => new PlainPassword('senha1234')).toThrow(ValidationDomainError);
  });

  it('aceita hash bcrypt valido e recusa hash invalido', () => {
    expect(new PasswordHash('$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e').toString()).toBe(
      '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e',
    );
    expect(() => new PasswordHash('hash-invalido')).toThrow(ValidationDomainError);
  });

  it('aceita variantes de hash bcrypt suportadas', () => {
    expect(
      new PasswordHash('$2b$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e').toString(),
    ).toContain('$2b$10$');
  });

  it('opera saldo com credito e debito', () => {
    const balance = new Balance('100.0000');
    const amount = new TransferAmount('10.5000');

    expect(balance.debit(amount).toString()).toBe('89.5000');
    expect(balance.credit(amount).toString()).toBe('110.5000');
  });

  it('impede saldo negativo e debito acima do saldo', () => {
    expect(() => new Balance('-1')).toThrow(ValidationDomainError);
    expect(() => new Balance('5.0000').debit(new TransferAmount('10.0000'))).toThrow(ValidationDomainError);
  });

  it('recusa saldo e valor de transferencia com mais de quatro casas decimais', () => {
    expect(() => new Balance('1.00001')).toThrow(ValidationDomainError);
    expect(() => new TransferAmount('10.12345')).toThrow(ValidationDomainError);
  });

  it('aceita debito exato ate zerar o saldo', () => {
    const result = new Balance('10.0000').debit(new TransferAmount('10.0000'));

    expect(result.toString()).toBe('0.0000');
  });

  it('normaliza money e transfer amount com quatro casas decimais', () => {
    expect(new Money('10').toString()).toBe('10.0000');
    expect(new TransferAmount('10').toString()).toBe('10.0000');
    expect(new Money('10.5').toString()).toBe('10.5000');
    expect(new TransferAmount('10.5').toString()).toBe('10.5000');
  });

  it('recusa money invalido em cenarios de faixa do dominio', () => {
    const invalidInputs = ['0', '-1', '10.12345'];

    for (const input of invalidInputs) {
      expect(() => new Money(input)).toThrow(ValidationDomainError);
    }
  });

  it('recusa money invalido em cenarios de formato bruto aceitos pelo parser decimal', () => {
    const invalidInputs = ['abc', '', ' '];

    for (const input of invalidInputs) {
      expect(() => new Money(input)).toThrow(Error);
    }
  });

  it('recusa transfer amount invalido em cenarios de faixa do dominio', () => {
    const invalidInputs = ['0', '-1', '10.12345'];

    for (const input of invalidInputs) {
      expect(() => new TransferAmount(input)).toThrow(ValidationDomainError);
    }
  });

  it('recusa transfer amount invalido em cenarios de formato bruto aceitos pelo parser decimal', () => {
    const invalidInputs = ['abc', '', ' '];

    for (const input of invalidInputs) {
      expect(() => new TransferAmount(input)).toThrow(Error);
    }
  });

  it('compara money usando a regra real do value object', () => {
    const amount = new Money('10.5000');

    expect(amount.greaterThan('10.4999')).toBe(true);
    expect(amount.greaterThan('10.5000')).toBe(false);
  });

  it('valida ids uuid e igualdade', () => {
    const userId = new UserId('11111111-1111-4111-8111-111111111111');
    const sameUserId = new UserId('11111111-1111-4111-8111-111111111111');

    expect(userId.equals(sameUserId)).toBe(true);
    expect(() => new AccountId('acc-1')).toThrow(ValidationDomainError);
  });

  it('normaliza chave de idempotencia recebida externamente', () => {
    const key = IdempotencyKey.fromRaw('  ABCDEF12-3456-4ABC-8DEF-1234567890AB  ');

    expect(key.toString()).toBe('abcdef12-3456-4abc-8def-1234567890ab');
  });
});

import api from './api';
import type {
  TransactionFilters,
  TransferRequest,
  TransferResponse,
  WalletBalanceResponse,
  WalletTransactionsResponse,
} from '../types/wallet';

export async function fetchWalletBalance(): Promise<WalletBalanceResponse> {
  const { data } = await api.get<WalletBalanceResponse>('/wallet/balance');
  return data;
}

export async function fetchWalletTransactions(filters: TransactionFilters): Promise<WalletTransactionsResponse> {
  const { data } = await api.get<WalletTransactionsResponse>('/wallet/transactions', { params: filters });
  return data;
}

export async function createWalletTransfer(payload: TransferRequest): Promise<TransferResponse> {
  const { idempotencyKey, ...body } = payload;
  const { data } = await api.post<TransferResponse>('/wallet/transfer', body, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return data;
}

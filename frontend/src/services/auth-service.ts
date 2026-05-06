import api from './api';
import type { LoginRequest, LoginResponse, RegisterUserRequest } from '../types/auth';

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function registerUser(payload: RegisterUserRequest): Promise<void> {
  await api.post('/users', payload);
}

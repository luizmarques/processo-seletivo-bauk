import api from "./api";
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterUserRequest,
} from "../types/auth";

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function registerUser(
  payload: RegisterUserRequest,
): Promise<void> {
  await api.post("/users", payload);
}

export async function logoutUser(): Promise<LogoutResponse> {
  const { data } = await api.post<LogoutResponse>("/auth/logout");
  return data;
}

import type {
  FeedbackMessage,
  JwtToken,
  Password,
  Username,
} from "./value-objects";

export interface LoginRequest {
  username: Username;
  password: Password;
}

export interface LoginResponse {
  accessToken: JwtToken;
}

export interface LogoutResponse {
  message: FeedbackMessage;
}

export interface RegisterUserRequest {
  username: Username;
  password: Password;
}

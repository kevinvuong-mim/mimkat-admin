import { SuccessResponse } from '../';

// Requests
interface LoginRequest {
  email: string;
  password: string;
}

interface LogoutRequest {}

interface RegisterRequest {
  email: string;
  password: string;
}

interface VerifyEmailRequest {
  token: string;
}

// Responses
interface LoginResponse extends SuccessResponse<{
  accessToken: string;
  refreshToken: string;
}> {}

interface LogoutResponse extends SuccessResponse<null> {}

interface RegisterResponse extends SuccessResponse<null> {}

interface VerifyEmailResponse extends SuccessResponse<null> {}

export type {
  // Requests
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  VerifyEmailRequest,

  // Responses
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
  VerifyEmailResponse,
};

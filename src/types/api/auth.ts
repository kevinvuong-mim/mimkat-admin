import { SuccessResponse } from '../';

// Requests
interface LoginRequest {
  email: string;
  password: string;
}

interface LogoutRequest {}

// Responses
interface LoginResponse extends SuccessResponse<{
  accessToken: string;
  refreshToken: string;
}> {}

interface LogoutResponse extends SuccessResponse<null> {}

export type {
  // Requests
  LoginRequest,
  LogoutRequest,

  // Responses
  LoginResponse,
  LogoutResponse,
};

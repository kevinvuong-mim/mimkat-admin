import {
  LoginRequest,
  LogoutRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@/types';
import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/error-handler';

const login = async (data: LoginRequest) => {
  try {
    const endpoint = '/auth/login';

    const response: LoginResponse = await apiClient.post(endpoint, data);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const logout = async (_data?: LogoutRequest) => {
  try {
    const endpoint = '/auth/logout';

    const response: LogoutResponse = await apiClient.post(endpoint);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const register = async (data: RegisterRequest) => {
  try {
    const endpoint = '/auth/register';

    const response: RegisterResponse = await apiClient.post(endpoint, data);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const verifyEmail = async (data: VerifyEmailRequest) => {
  try {
    const endpoint = '/verification/email';

    const response: VerifyEmailResponse = await apiClient.get(endpoint, {
      params: { token: data.token },
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export { login, logout, register, verifyEmail };

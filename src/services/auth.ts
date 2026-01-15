import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/error-handler';
import { LoginRequest, LogoutRequest, LoginResponse, LogoutResponse } from '@/types';

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

export { login, logout };

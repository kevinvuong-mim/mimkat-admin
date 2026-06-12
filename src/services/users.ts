import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/error-handler';
import {
  CurrentUser,
  GetMeRequest,
  GetMeResponse,
  LookupUserByEmailRequest,
  LookupUserByEmailResponse,
  User,
} from '@/types';

const getMe = async (_data?: GetMeRequest): Promise<CurrentUser> => {
  try {
    const endpoint = '/users/me';

    const response: GetMeResponse = await apiClient.get(endpoint);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const lookupUserByEmail = async (data: LookupUserByEmailRequest): Promise<User> => {
  try {
    const response: LookupUserByEmailResponse = await apiClient.get('/users/lookup', {
      params: { email: data.email.trim() },
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export { getMe, lookupUserByEmail };

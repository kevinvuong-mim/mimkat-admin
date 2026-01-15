import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/error-handler';
import { CurrentUser, GetMeRequest, GetMeResponse } from '@/types';

const getMe = async (_data?: GetMeRequest): Promise<CurrentUser> => {
  try {
    const endpoint = '/users/me';

    const response: GetMeResponse = await apiClient.get(endpoint);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export { getMe };

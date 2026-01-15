import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/error-handler';
import { GetSessionsRequest, GetSessionsResponse } from '@/types';

const getSessions = async (_data?: GetSessionsRequest) => {
  try {
    const endpoint = '/users/sessions';

    const response: GetSessionsResponse = await apiClient.get(endpoint);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export { getSessions };

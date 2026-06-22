import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/error-handler';
import { GetPresenceResponse, UserPresence } from '@/types/presence';

const getPresence = async (userIds: string[]): Promise<UserPresence[]> => {
  try {
    const response: GetPresenceResponse = await apiClient.get('/presence', {
      params: { userIds: userIds.join(',') },
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export { getPresence };

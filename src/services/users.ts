import {
  CurrentUser,
  GetMeRequest,
  GetMeResponse,
  LogoutDeviceRequest,
  LogoutDeviceResponse,
  LogoutAllDevicesRequest,
  LogoutAllDevicesResponse,
} from '@/types';
import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/error-handler';

const getMe = async (_data?: GetMeRequest): Promise<CurrentUser> => {
  try {
    const endpoint = '/users/me';

    const response: GetMeResponse = await apiClient.get(endpoint);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const logoutDevice = async (data: LogoutDeviceRequest) => {
  try {
    const endpoint = `/users/sessions/${data.tokenId}`;

    const response: LogoutDeviceResponse = await apiClient.delete(endpoint);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const logoutAllDevices = async (_data?: LogoutAllDevicesRequest) => {
  try {
    const endpoint = '/users/sessions';

    const response: LogoutAllDevicesResponse = await apiClient.delete(endpoint);

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export { getMe, logoutDevice, logoutAllDevices };

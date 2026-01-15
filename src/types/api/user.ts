import { CurrentUser, SuccessResponse } from '../';

// Requests
interface GetMeRequest {}

interface LogoutDeviceRequest {
  tokenId: string;
}

interface LogoutAllDevicesRequest {}

// Responses
interface GetMeResponse extends SuccessResponse<CurrentUser> {}

interface LogoutDeviceResponse extends SuccessResponse<null> {}

interface LogoutAllDevicesResponse extends SuccessResponse<null> {}

export type {
  // Requests
  GetMeRequest,
  LogoutDeviceRequest,
  LogoutAllDevicesRequest,

  // Responses
  GetMeResponse,
  LogoutDeviceResponse,
  LogoutAllDevicesResponse,
};

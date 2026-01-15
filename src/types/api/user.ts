import { CurrentUser, SuccessResponse } from '../';

// Requests
interface GetMeRequest {}

// Responses
interface GetMeResponse extends SuccessResponse<CurrentUser> {}

export type {
  // Requests
  GetMeRequest,

  // Responses
  GetMeResponse,
};

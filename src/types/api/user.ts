import { User, CurrentUser, SuccessResponse } from '../';

// Requests
interface GetMeRequest {}

interface LookupUserByEmailRequest {
  email: string;
}

// Responses
interface GetMeResponse extends SuccessResponse<CurrentUser> {}

interface LookupUserByEmailResponse extends SuccessResponse<User> {}

export type {
  // Requests
  GetMeRequest,
  LookupUserByEmailRequest,

  // Responses
  GetMeResponse,
  LookupUserByEmailResponse,
};

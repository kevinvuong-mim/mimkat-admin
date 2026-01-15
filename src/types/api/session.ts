import { Session, PaginatedData, SuccessResponse } from '../';

// Requests
interface GetSessionsRequest {}

// Responses
interface GetSessionsResponse extends SuccessResponse<PaginatedData<Session>> {}

export type {
  // Requests
  GetSessionsRequest,

  // Responses
  GetSessionsResponse,
};

import axios from 'axios';

import { ErrorResponse } from '@/types';

export const handleApiError = (error: unknown): ErrorResponse => {
  if (axios.isAxiosError(error) && error.response) return error.response.data;

  return {
    success: false,
    statusCode: 500,
    error: 'Internal Error',
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    path: axios.isAxiosError(error) ? error.config?.url || error.request?.path || '' : '',
  };
};

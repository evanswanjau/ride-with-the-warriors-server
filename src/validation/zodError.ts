import type { ZodError } from 'zod';

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function zodToApiError(err: ZodError): ApiErrorResponse {
  return {
    error: {
      code: 'VALIDATION',
      message: 'Validation failed',
      details: err.flatten(),
    },
  };
}


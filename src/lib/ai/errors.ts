export type AIErrorType = 
  | 'quota_exhausted' 
  | 'rate_limited' 
  | 'timeout' 
  | 'network_failure' 
  | 'invalid_api_key' 
  | 'provider_unavailable' 
  | 'internal_error';

export interface ParsedAIError {
  status: number;
  errorType: AIErrorType;
  friendlyMessage: string;
}

export function parseAIError(error: any): ParsedAIError {
  const errorString = error?.message?.toLowerCase() || error?.toString().toLowerCase() || '';
  const status = error?.status || error?.response?.status;

  // 1. Quota Exhaustion
  if (
    status === 429 && (errorString.includes('quota') || errorString.includes('exhausted')) ||
    errorString.includes('resource_exhausted') ||
    errorString.includes('insufficient_quota')
  ) {
    return {
      status: 429,
      errorType: 'quota_exhausted',
      friendlyMessage: "FirstHomeBuyer AI is temporarily unavailable.\n\nWe've reached our AI usage limit at the moment. Please try again later. You can continue exploring grants and schemes while the AI becomes available again."
    };
  }

  // 2. Rate Limiting
  if (
    status === 429 || 
    errorString.includes('too many requests') || 
    errorString.includes('rate limit')
  ) {
    return {
      status: 429,
      errorType: 'rate_limited',
      friendlyMessage: "You're sending messages too quickly. Please wait a few moments and try again."
    };
  }

  // 3. Timeout
  if (
    status === 408 || 
    status === 504 || 
    errorString.includes('timeout') || 
    errorString.includes('deadline_exceeded') || 
    errorString.includes('aborted')
  ) {
    return {
      status: 408,
      errorType: 'timeout',
      friendlyMessage: "The AI took too long to respond. Please try again."
    };
  }

  // 4. Invalid API Key / Auth
  if (
    status === 401 || 
    status === 403 || 
    errorString.includes('api_key') || 
    errorString.includes('unauthenticated') || 
    errorString.includes('forbidden')
  ) {
    return {
      status: 500, // Hide auth issues from client by returning 500
      errorType: 'invalid_api_key',
      friendlyMessage: "Something went wrong while processing your request. Please try again later."
    };
  }

  // 5. Network / Provider Unavailable
  if (
    status === 502 || 
    status === 503 || 
    errorString.includes('fetch') || 
    errorString.includes('network error') || 
    errorString.includes('econnrefused') ||
    errorString.includes('unavailable')
  ) {
    return {
      status: 503,
      errorType: 'provider_unavailable',
      friendlyMessage: "Unable to connect to the AI service. Please check your internet connection and try again."
    };
  }

  // 6. Unknown Internal Error
  return {
    status: 500,
    errorType: 'internal_error',
    friendlyMessage: "Something went wrong while processing your request. Please try again later."
  };
}

/**
 * Utility helper to safely extract data from API responses.
 * Handles both wrapped { success: true, data: T } and direct responses T.
 */
export function unwrapData<T>(response: any): T {
  if (!response) return response as T;
  if (typeof response === 'object' && 'data' in response && response.data !== undefined) {
    return response.data as T;
  }
  return response as T;
}

export function unwrapArray<T>(response: any): T[] {
  const unwrapped = unwrapData<any>(response);
  if (Array.isArray(unwrapped)) {
    return unwrapped as T[];
  }
  if (Array.isArray(response)) {
    return response as T[];
  }
  return [];
}

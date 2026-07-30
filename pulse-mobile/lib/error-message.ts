/**
 * Extracts a human-readable message from a thrown value that might not be a
 * real `Error` instance (e.g. some error shapes cross the RN/Hermes bundle
 * boundary as plain objects rather than passing `instanceof Error`).
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

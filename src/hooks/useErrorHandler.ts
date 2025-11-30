import { useCallback } from 'react';

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorHandlerOptions {
  // Show alert to user
  showAlert?: boolean;
  // Log to console
  logToConsole?: boolean;
  // Custom error message
  customMessage?: string;
  // Error severity
  severity?: ErrorSeverity;
  // Callback for additional handling (e.g., send to monitoring service)
  onError?: (error: Error, context?: string) => void;
}

interface UseErrorHandlerReturn {
  handleError: (error: unknown, context?: string, options?: ErrorHandlerOptions) => void;
  clearError: () => void;
}

/**
 * Custom hook for consistent error handling across the application
 *
 * @example
 * ```typescript
 * const { handleError } = useErrorHandler();
 *
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, 'Failed to load data', {
 *     showAlert: true,
 *     severity: 'error'
 *   });
 * }
 * ```
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const handleError = useCallback(
    (
      error: unknown,
      context?: string,
      options: ErrorHandlerOptions = {}
    ) => {
      const {
        showAlert = false,
        logToConsole = true,
        customMessage,
        severity = 'error',
        onError,
      } = options;

      // Convert to Error object
      const err = error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : 'Unknown error');

      // Construct error message
      const message = customMessage || err.message;
      const fullMessage = context ? `${context}: ${message}` : message;

      // Log to console
      if (logToConsole) {
        const logFn = severity === 'warning' ? console.warn :
                      severity === 'info' ? console.info :
                      console.error;

        logFn(`[${severity.toUpperCase()}]`, fullMessage, err);
      }

      // Show alert to user
      if (showAlert) {
        alert(fullMessage);
      }

      // Call custom error handler (e.g., send to Sentry)
      if (onError) {
        onError(err, context);
      }

      // In production, you would send errors to a monitoring service here
      // Example: Sentry.captureException(err, { tags: { context, severity } });
    },
    []
  );

  const clearError = useCallback(() => {
    // Placeholder for clearing error state if needed
    // This could be extended to work with a global error state
  }, []);

  return {
    handleError,
    clearError,
  };
}

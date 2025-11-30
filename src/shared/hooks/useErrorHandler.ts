import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { ServiceError } from '../services/baseService';

export function useErrorHandler() {
  const { showError } = useToast();

  return useCallback((error: unknown, fallbackMessage = 'An error occurred') => {
    let message = fallbackMessage;

    if (error instanceof ServiceError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as { message: unknown }).message);
    }

    console.error('Error handled:', error);
    showError(message);
  }, [showError]);
}


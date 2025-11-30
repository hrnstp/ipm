// Базовый сервис с обработкой ошибок и логированием
import { PostgrestError } from '@supabase/supabase-js';
import { ApiResponse } from '../types/api.types';

export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export abstract class BaseService {
  /**
   * Обработка ошибок Supabase
   */
  protected handleError(error: unknown, context: string): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const pgError = error as PostgrestError;
      const message = pgError.message || `Error in ${context}`;
      return new ServiceError(message, pgError.code, pgError.details);
    }

    const message = error instanceof Error 
      ? error.message 
      : `Unknown error in ${context}`;
    
    return new ServiceError(message, undefined, error);
  }

  /**
   * Логирование запросов (можно расширить для интеграции с Sentry)
   */
  protected logQuery(table: string, operation: string, data?: unknown): void {
    if (import.meta.env.DEV) {
      console.log(`[Service] ${operation} on ${table}`, data || '');
    }
  }

  /**
   * Обработка ответа Supabase
   */
  protected handleResponse<T>(
    data: T | null,
    error: PostgrestError | null,
    context: string
  ): ApiResponse<T> {
    if (error) {
      const serviceError = this.handleError(error, context);
      console.error(`[Service Error] ${context}:`, serviceError);
      return { data: null, error: error };
    }

    return { data, error: null };
  }

  /**
   * Валидация обязательных параметров
   */
  protected validateRequired<T extends Record<string, unknown>>(
    params: T,
    requiredFields: (keyof T)[]
  ): void {
    const missing = requiredFields.filter(field => !params[field]);
    
    if (missing.length > 0) {
      throw new ServiceError(
        `Missing required fields: ${missing.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }
  }
}


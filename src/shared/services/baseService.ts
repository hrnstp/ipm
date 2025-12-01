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
   * Логирование запросов (безопасное - без данных)
   * Для production: интеграция с Sentry или другим сервисом
   */
  protected logQuery(table: string, operation: string): void {
    // В production логирование отключено для безопасности
    // Данные операций НЕ логируются чтобы избежать утечки чувствительной информации
    if (import.meta.env.DEV) {
      console.log(`[Service] ${operation} on ${table}`);
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
      // Безопасное логирование: только сообщение об ошибке, без деталей
      // Детали ошибки могут содержать чувствительную информацию о структуре БД
      if (import.meta.env.DEV) {
        console.error(`[Service Error] ${context}: ${serviceError.message}`);
      }
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


import { ErrorInfo } from 'react';

/**
 * Error logging utility for centralized error tracking
 * Ready for integration with monitoring services like Sentry, LogRocket, etc.
 */

interface ErrorContext {
  componentStack?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

class ErrorLogger {
  private isProduction: boolean;
  private monitoringEnabled: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.monitoringEnabled = false; // Set to true when monitoring service is configured
  }

  /**
   * Log an error with context information
   */
  logError(error: Error, errorInfo?: ErrorInfo, context?: ErrorContext): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context,
    };

    // Always log to console in development
    if (!this.isProduction) {
      console.group('🔴 Error Logged');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Context:', context);
      console.error('Full Data:', errorData);
      console.groupEnd();
    }

    // Send to monitoring service in production
    if (this.isProduction && this.monitoringEnabled) {
      this.sendToMonitoring(errorData);
    }
  }

  /**
   * Log a warning (non-critical error)
   */
  logWarning(message: string, context?: ErrorContext): void {
    const warningData = {
      message,
      severity: 'warning',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context,
    };

    console.warn('⚠️ Warning:', warningData);

    if (this.isProduction && this.monitoringEnabled) {
      this.sendToMonitoring(warningData);
    }
  }

  /**
   * Log an info message (for tracking important events)
   */
  logInfo(message: string, context?: ErrorContext): void {
    const infoData = {
      message,
      severity: 'info',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context,
    };

    console.info('ℹ️ Info:', infoData);

    if (this.monitoringEnabled) {
      this.sendToMonitoring(infoData);
    }
  }

  /**
   * Send error to monitoring service
   * Replace with actual monitoring service integration (Sentry, LogRocket, etc.)
   */
  private sendToMonitoring(data: any): void {
    // Example: Sentry integration
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureException(new Error(data.message), {
    //     contexts: {
    //       error: data,
    //     },
    //   });
    // }

    // Example: Custom API endpoint
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // }).catch(err => console.error('Failed to send error log:', err));

    // For now, just log that we would send it
    console.log('📤 Would send to monitoring service:', data);
  }

  /**
   * Enable monitoring service integration
   */
  enableMonitoring(): void {
    this.monitoringEnabled = true;
  }

  /**
   * Disable monitoring service integration
   */
  disableMonitoring(): void {
    this.monitoringEnabled = false;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export types
export type { ErrorContext };

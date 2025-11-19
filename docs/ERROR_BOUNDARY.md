# Error Boundary Implementation

## Overview

The Error Boundary component catches JavaScript errors anywhere in the child component tree, logs error information, and displays a fallback UI instead of crashing the entire application.

## Architecture

### Two-Level Error Handling

```
<ErrorBoundary (Root Level)>           ← Catches provider errors
  <ThemeProvider>
    <AuthProvider>
      <ErrorBoundary (App Level)>      ← Catches application errors
        <AppContent>
          <Dashboard />
        </AppContent>
      </ErrorBoundary>
    </AuthProvider>
  </ThemeProvider>
</ErrorBoundary>
```

**Root Level**: Catches errors in theme and authentication providers
**App Level**: Catches errors in application components (Dashboard, Auth, etc.)

## Files

### Core Components

- **`src/components/ErrorBoundary.tsx`** - React Error Boundary component
- **`src/utils/errorLogging.ts`** - Centralized error logging utility
- **`src/App.tsx`** - Integration point

## Features

### 1. Error Boundary Component

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handler
    errorLogger.logError(error, errorInfo);
  }}
  fallback={<CustomErrorUI />} // Optional custom UI
>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- ✅ Catches rendering errors
- ✅ Displays user-friendly fallback UI
- ✅ Shows error details in development mode
- ✅ Provides recovery actions (Try Again, Reload, Go Home)
- ✅ Custom error handler support
- ✅ Custom fallback UI support

### 2. Error Logging Utility

```typescript
import { errorLogger } from './utils/errorLogging';

// Log an error
errorLogger.logError(error, errorInfo, {
  context: 'Dashboard',
  userId: user.id,
  sessionId: session.id,
});

// Log a warning
errorLogger.logWarning('API response slow', {
  endpoint: '/api/rfps',
  duration: 3000,
});

// Log info event
errorLogger.logInfo('User action completed', {
  action: 'create_rfp',
  duration: 1200,
});
```

**Features:**
- ✅ Centralized error logging
- ✅ Context-aware logging
- ✅ Development/Production modes
- ✅ Ready for monitoring service integration (Sentry, LogRocket)
- ✅ Severity levels (error, warning, info)

## Fallback UI

### Production View

Clean, user-friendly error page with:
- Error icon and message
- "Try Again" button - Resets error boundary
- "Reload Page" button - Full page refresh
- "Go Home" button - Navigate to home page
- Support contact information

### Development View

Additional debugging information:
- Error message
- Stack trace
- Component stack
- Expandable details section

## Error Recovery

### Try Again
Resets the error boundary state without reloading the page. Best for transient errors.

```typescript
handleReset = (): void => {
  this.setState({
    hasError: false,
    error: null,
    errorInfo: null,
  });
};
```

### Reload Page
Full page refresh. Use when error might be related to stale state.

### Go Home
Navigate back to home page. Use when error is in a specific feature.

## Integration with Monitoring Services

### Sentry Integration (Future)

```typescript
// In src/utils/errorLogging.ts

private sendToMonitoring(data: any): void {
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(new Error(data.message), {
      contexts: {
        error: data,
      },
      tags: {
        context: data.context,
      },
    });
  }
}
```

### Enable Monitoring

```typescript
// In main.tsx or App.tsx
import { errorLogger } from './utils/errorLogging';

// Enable monitoring in production
if (process.env.NODE_ENV === 'production') {
  errorLogger.enableMonitoring();
}
```

## Testing

### Manual Testing

Create a test component that throws an error:

```tsx
function ErrorTestButton() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error from ErrorBoundary!');
  }

  return (
    <button onClick={() => setShouldError(true)}>
      Trigger Error
    </button>
  );
}
```

### Automated Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

test('catches errors and displays fallback UI', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Best Practices

### 1. Granular Error Boundaries

Place error boundaries at different levels of your component tree:

```tsx
<ErrorBoundary>                      {/* Root level */}
  <Layout>
    <ErrorBoundary>                  {/* Feature level */}
      <Dashboard />
    </ErrorBoundary>
    <ErrorBoundary>
      <Settings />
    </ErrorBoundary>
  </Layout>
</ErrorBoundary>
```

### 2. Context in Error Logs

Always provide context when logging errors:

```typescript
errorLogger.logError(error, errorInfo, {
  context: 'RFP Creation',
  userId: user.id,
  rfpId: rfp.id,
  action: 'submit',
});
```

### 3. Don't Catch Everything

Error boundaries don't catch:
- Event handlers (use try-catch)
- Async code (use try-catch or .catch())
- Server-side rendering
- Errors in the error boundary itself

### 4. Provide Recovery Options

Always give users a way to recover:
- Reset error boundary
- Reload page
- Navigate away
- Contact support

## Monitoring Dashboard (Future)

When integrated with a monitoring service, track:

- **Error Rate**: Errors per hour/day
- **Error Types**: Most common errors
- **Affected Users**: Number of users impacted
- **Component Stack**: Which components error most
- **Browser/Device**: Error distribution by platform
- **Recovery Rate**: How many users recover vs abandon

## Migration Path

### Phase 1: ✅ Basic Implementation
- Error Boundary component
- Fallback UI
- Error logging utility
- Integration in App.tsx

### Phase 2: 🔄 Enhanced Logging
- Add user context to errors
- Add session tracking
- Implement error sampling (don't log every error)

### Phase 3: 📊 Monitoring Integration
- Integrate Sentry or similar
- Set up error alerting
- Create monitoring dashboard

### Phase 4: 🎯 Advanced Features
- Error replay (record user actions before error)
- Source map support
- Error grouping and deduplication
- Performance monitoring

## Troubleshooting

### Error Boundary Not Catching Errors

**Problem**: Error passes through boundary
**Solution**: Error boundaries don't catch event handler errors. Use try-catch:

```typescript
const handleClick = async () => {
  try {
    await someAsyncOperation();
  } catch (error) {
    errorLogger.logError(error as Error);
  }
};
```

### Infinite Error Loop

**Problem**: Error boundary fallback UI throws error
**Solution**: Keep fallback UI simple, avoid complex logic

### Missing Error Context

**Problem**: Can't identify error source
**Solution**: Add more specific error boundaries at feature level

## Resources

- [React Error Boundaries Docs](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Handling in React](https://react.dev/learn/error-boundaries)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)

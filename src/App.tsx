import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { errorLogger } from './utils/errorLogging';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-themed-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-themed-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Use centralized error logger for root-level errors
        errorLogger.logError(error, errorInfo, {
          context: 'App Root',
          critical: true,
        });
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              // Log application-level errors
              errorLogger.logError(error, errorInfo, {
                context: 'Application',
              });
            }}
          >
            <AppContent />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

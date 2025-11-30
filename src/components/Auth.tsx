import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';
import { Globe2, Building2, Users, Network } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from '../shared/validation/schemas/authSchema';
import { useValidatedForm } from '../shared/hooks/useValidatedForm';
import { useErrorHandler } from '../shared/hooks/useErrorHandler';
import { useToast } from '../shared/hooks/useToast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp } = useAuth();
  const handleError = useErrorHandler();
  const { showSuccess } = useToast();

  const signInForm = useValidatedForm<SignInInput>(signInSchema);
  const signUpForm = useValidatedForm<SignUpInput>(signUpSchema, {
    role: 'developer',
  });

  const handleSignIn = async (data: SignInInput) => {
    try {
      await signIn(data.email, data.password);
      showSuccess('Welcome back!');
    } catch (error) {
      handleError(error, 'Failed to sign in');
    }
  };

  const handleSignUp = async (data: SignUpInput) => {
    try {
      await signUp(data.email, data.password, {
        full_name: data.full_name,
        organization: data.organization,
        country: data.country,
        region: data.region,
        role: data.role,
        bio: data.bio,
      });
      showSuccess('Account created successfully!');
    } catch (error) {
      handleError(error, 'Failed to create account');
    }
  };

  const globalSouthRegions = [
    'Sub-Saharan Africa',
    'Latin America & Caribbean',
    'South Asia',
    'Southeast Asia',
    'Middle East & North Africa',
    'Central Asia',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Globe2 className="w-6 h-6 text-emerald-600" />
          <span className="font-bold">CityMind AI</span>
        </div>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center mt-12 md:mt-0">
        <div className="text-center md:text-left space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Globe2 className="w-12 h-12 text-emerald-600" />
            <h1 className="text-4xl font-bold text-themed-primary">SmartCity Connect</h1>
          </div>

          <p className="text-xl text-themed-secondary">
            International B2B Platform for Smart City Technology Transfer
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-themed-primary">For Municipalities</h3>
                <p className="text-themed-secondary text-sm">Access cutting-edge smart city solutions tailored to your needs</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-themed-primary">For Developers</h3>
                <p className="text-themed-secondary text-sm">Connect your innovations with municipalities in the Global South</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Network className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-themed-primary">For Integrators</h3>
                <p className="text-themed-secondary text-sm">Bridge technology gaps and facilitate successful implementations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-themed-secondary rounded-2xl shadow-xl p-8 border border-themed-primary">
          <h2 className="text-2xl font-bold text-themed-primary mb-6">
            {isLogin ? 'Welcome Back' : 'Join the Platform'}
          </h2>

          {isLogin ? (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...signInForm.register('email')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                    signInForm.formState.errors.email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300'
                  }`}
                />
                {signInForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signInForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...signInForm.register('password')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                    signInForm.formState.errors.password
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300'
                  }`}
                />
                {signInForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signInForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={signInForm.formState.isSubmitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signInForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  {...signUpForm.register('full_name')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary ${
                    signUpForm.formState.errors.full_name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-themed-primary'
                  }`}
                />
                {signUpForm.formState.errors.full_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Role
                </label>
                <select
                  {...signUpForm.register('role')}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary"
                >
                  <option value="developer">Solution Developer</option>
                  <option value="municipality">Municipality</option>
                  <option value="integrator">System Integrator</option>
                </select>
                {signUpForm.formState.errors.role && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  {...signUpForm.register('organization')}
                  placeholder={signUpForm.watch('role') === 'municipality' ? 'City name' : 'Company name'}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary ${
                    signUpForm.formState.errors.organization
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-themed-primary'
                  }`}
                />
                {signUpForm.formState.errors.organization && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.organization.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Country
                </label>
                <input
                  type="text"
                  {...signUpForm.register('country')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary ${
                    signUpForm.formState.errors.country
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-themed-primary'
                  }`}
                />
                {signUpForm.formState.errors.country && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.country.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Region
                </label>
                <select
                  {...signUpForm.register('region')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary ${
                    signUpForm.formState.errors.region
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-themed-primary'
                  }`}
                >
                  <option value="">Select Region</option>
                  {globalSouthRegions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {signUpForm.formState.errors.region && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.region.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...signUpForm.register('email')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                    signUpForm.formState.errors.email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300'
                  }`}
                />
                {signUpForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...signUpForm.register('password')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                    signUpForm.formState.errors.password
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300'
                  }`}
                />
                {signUpForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={signUpForm.formState.isSubmitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signUpForm.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

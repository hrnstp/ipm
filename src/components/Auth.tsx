import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';
import { Globe2, Building2, Users, Network } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [role, setRole] = useState<UserRole>('developer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, {
          full_name: fullName,
          organization,
          country,
          region,
          role,
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-themed-primary flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
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

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary"
                  >
                    <option value="developer">Solution Developer</option>
                    <option value="municipality">Municipality</option>
                    <option value="integrator">System Integrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder={role === 'municipality' ? 'City name' : 'Company name'}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-themed-primary text-themed-primary"
                  >
                    <option value="">Select Region</option>
                    {globalSouthRegions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

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

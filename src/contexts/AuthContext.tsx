import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state on mount
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    })();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, profileData: Partial<Profile>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Try to use the database function first (if migration is applied)
      try {
        // Prepare municipality or integrator data if needed
        let municipalityData = null;
        let integratorData = null;

        if (profileData.role === 'municipality') {
          municipalityData = {
            city_name: profileData.organization || '',
            language: 'en',
          };
        } else if (profileData.role === 'integrator') {
          integratorData = {
            company_name: profileData.organization || '',
          };
        }

        const { data: profileId, error: profileError } = await supabase.rpc('create_user_profile', {
          p_user_id: data.user.id,
          p_email: email,
          p_full_name: profileData.full_name || '',
          p_role: profileData.role || 'developer',
          p_organization: profileData.organization || '',
          p_country: profileData.country || '',
          p_region: profileData.region || '',
          p_bio: profileData.bio || '',
          p_avatar_url: profileData.avatar_url || null,
          p_municipality_data: municipalityData,
          p_integrator_data: integratorData,
        });

        if (!profileError) {
          // Function worked, reload profile
          await loadProfile(data.user.id);
          return;
        }

        // If function not found, fall back to direct INSERT
        if (profileError.code === '42883' || profileError.message?.includes('function') || profileError.message?.includes('not found')) {
          console.warn('Function not found, using direct INSERT');
        } else {
          throw profileError;
        }
      } catch (rpcError: any) {
        // If RPC fails (function not found), fall back to direct INSERT
        if (rpcError.code === '42883' || rpcError.message?.includes('function') || rpcError.message?.includes('not found')) {
          console.warn('Function not available, using direct INSERT');
        } else {
          throw rpcError;
        }
      }

      // Fallback: Direct INSERT (requires updated RLS policies from migration)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          email,
          full_name: profileData.full_name || '',
          role: profileData.role || 'developer',
          organization: profileData.organization || '',
          country: profileData.country || '',
          region: profileData.region || '',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || null,
        }]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Create role-specific records
      if (profileData.role === 'municipality') {
        const { error: municipalityError } = await supabase.from('municipalities').insert([{
          profile_id: data.user.id,
          city_name: profileData.organization || '',
          language: 'en',
        }]);
        if (municipalityError) {
          console.error('Municipality creation error:', municipalityError);
          // Don't throw - profile is created, municipality can be added later
        }
      } else if (profileData.role === 'integrator') {
        const { error: integratorError } = await supabase.from('integrators').insert([{
          profile_id: data.user.id,
          company_name: profileData.organization || '',
        }]);
        if (integratorError) {
          console.error('Integrator creation error:', integratorError);
          // Don't throw - profile is created, integrator can be added later
        }
      }

      // Reload profile after creation
      await loadProfile(data.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

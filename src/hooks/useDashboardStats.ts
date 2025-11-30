import { useDataFetching } from './useDataFetching';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/supabase';

interface DashboardStats {
  solutions: number;
  connections: number;
  projects: number;
  municipalities: number;
}

/**
 * Custom hook to load dashboard statistics
 * Uses useDataFetching for consistent loading/error states
 */
export function useDashboardStats(profile: Profile | null) {
  const { data: stats, loading, error, refetch } = useDataFetching<DashboardStats>({
    queryFn: async () => {
      if (!profile) {
        return {
          data: {
            solutions: 0,
            connections: 0,
            projects: 0,
            municipalities: 0,
          },
          error: null,
        };
      }

      const [solutionsRes, connectionsInitiatorRes, connectionsRecipientRes, projectsRes, municipalitiesRes] =
        await Promise.all([
          supabase.from('smart_solutions').select('id', { count: 'exact', head: true }),
          supabase.from('connections').select('id', { count: 'exact', head: true }).eq('initiator_id', profile.id),
          supabase.from('connections').select('id', { count: 'exact', head: true }).eq('recipient_id', profile.id),
          supabase.from('projects').select('id', { count: 'exact', head: true }),
          supabase.from('municipalities').select('id', { count: 'exact', head: true }),
        ]);

      const totalConnections = (connectionsInitiatorRes.count || 0) + (connectionsRecipientRes.count || 0);

      return {
        data: {
          solutions: solutionsRes.count || 0,
          connections: totalConnections,
          projects: projectsRes.count || 0,
          municipalities: municipalitiesRes.count || 0,
        },
        error: null,
      };
    },
    dependencies: [profile?.id],
    fetchOnMount: !!profile,
  });

  return {
    stats: stats || { solutions: 0, connections: 0, projects: 0, municipalities: 0 },
    loading,
    error,
    refetch,
  };
}

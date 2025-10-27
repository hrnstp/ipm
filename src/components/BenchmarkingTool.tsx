import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, Award, Users, DollarSign, Target } from 'lucide-react';

interface MunicipalityBenchmark {
  id: string;
  municipality_id: string;
  municipality_name: string;
  population: number;
  total_projects: number;
  active_solutions: number;
  total_budget: number;
  avg_project_duration: number;
  satisfaction_score: number;
  innovation_index: number;
  digital_maturity: number;
}

export default function BenchmarkingTool() {
  const { profile } = useAuth();
  const [benchmarks, setBenchmarks] = useState<MunicipalityBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [sortBy, setSortBy] = useState<'innovation' | 'satisfaction' | 'projects' | 'maturity'>('innovation');

  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'municipality');

      if (profilesError) throw profilesError;

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('municipality_id, status, budget, created_at, updated_at');

      if (projectsError) throw projectsError;

      const { data: solutions, error: solutionsError } = await supabase
        .from('solutions')
        .select('*');

      if (solutionsError) throw solutionsError;

      const { data: ratings, error: ratingsError } = await supabase
        .from('vendor_ratings')
        .select('overall_rating');

      if (ratingsError) throw ratingsError;

      const benchmarkData: MunicipalityBenchmark[] = profiles.map(municipality => {
        const municipalityProjects = projects?.filter(p => p.municipality_id === municipality.id) || [];
        const activeSolutions = municipalityProjects.filter(p => p.status === 'active').length;
        const totalBudget = municipalityProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

        const completedProjects = municipalityProjects.filter(p => p.status === 'completed');
        const avgDuration = completedProjects.length > 0
          ? completedProjects.reduce((sum, p) => {
              const start = new Date(p.created_at);
              const end = new Date(p.updated_at);
              return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            }, 0) / completedProjects.length
          : 0;

        const avgRating = ratings && ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length
          : 0;

        const innovationIndex = Math.min(100,
          (activeSolutions * 10) +
          (municipalityProjects.length * 5) +
          (avgRating * 10)
        );

        const digitalMaturity = Math.min(100,
          (municipalityProjects.length > 0 ? 30 : 0) +
          (activeSolutions > 2 ? 30 : activeSolutions * 10) +
          (avgRating > 4 ? 40 : avgRating * 8)
        );

        const population = municipality.organization?.includes('City') ? 500000 :
                          municipality.organization?.includes('Town') ? 100000 : 250000;

        return {
          id: municipality.id,
          municipality_id: municipality.id,
          municipality_name: municipality.organization || 'Unknown Municipality',
          population,
          total_projects: municipalityProjects.length,
          active_solutions: activeSolutions,
          total_budget: totalBudget,
          avg_project_duration: Math.round(avgDuration),
          satisfaction_score: Math.round(avgRating * 20),
          innovation_index: Math.round(innovationIndex),
          digital_maturity: Math.round(digitalMaturity),
        };
      });

      setBenchmarks(benchmarkData);
    } catch (error) {
      console.error('Error loading benchmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBySize = (benchmark: MunicipalityBenchmark) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'small') return benchmark.population < 150000;
    if (selectedCategory === 'medium') return benchmark.population >= 150000 && benchmark.population < 400000;
    return benchmark.population >= 400000;
  };

  const sortBenchmarks = (a: MunicipalityBenchmark, b: MunicipalityBenchmark) => {
    switch (sortBy) {
      case 'innovation':
        return b.innovation_index - a.innovation_index;
      case 'satisfaction':
        return b.satisfaction_score - a.satisfaction_score;
      case 'projects':
        return b.total_projects - a.total_projects;
      case 'maturity':
        return b.digital_maturity - a.digital_maturity;
      default:
        return 0;
    }
  };

  const filteredAndSorted = benchmarks.filter(filterBySize).sort(sortBenchmarks);

  const averages = {
    projects: Math.round(filteredAndSorted.reduce((sum, b) => sum + b.total_projects, 0) / filteredAndSorted.length || 0),
    budget: Math.round(filteredAndSorted.reduce((sum, b) => sum + b.total_budget, 0) / filteredAndSorted.length || 0),
    innovation: Math.round(filteredAndSorted.reduce((sum, b) => sum + b.innovation_index, 0) / filteredAndSorted.length || 0),
    maturity: Math.round(filteredAndSorted.reduce((sum, b) => sum + b.digital_maturity, 0) / filteredAndSorted.length || 0),
  };

  const getPercentileRank = (value: number, allValues: number[]) => {
    const sorted = [...allValues].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return Math.round((index / sorted.length) * 100);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading benchmarks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All Municipalities
          </button>
          <button
            onClick={() => setSelectedCategory('small')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === 'small' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Small (&lt;150K)
          </button>
          <button
            onClick={() => setSelectedCategory('medium')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Medium (150K-400K)
          </button>
          <button
            onClick={() => setSelectedCategory('large')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === 'large' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Large (&gt;400K)
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mr-2">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="innovation">Innovation Index</option>
            <option value="satisfaction">Satisfaction Score</option>
            <option value="projects">Total Projects</option>
            <option value="maturity">Digital Maturity</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <BarChart3 className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{averages.projects}</div>
          <div className="text-blue-100 text-sm">Avg Projects</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <DollarSign className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">${(averages.budget / 1000).toFixed(0)}K</div>
          <div className="text-green-100 text-sm">Avg Budget</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <Award className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{averages.innovation}</div>
          <div className="text-purple-100 text-sm">Avg Innovation</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
          <Target className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{averages.maturity}</div>
          <div className="text-orange-100 text-sm">Avg Maturity</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Municipality
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Population
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Active Solutions
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Total Budget
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Innovation Index
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Digital Maturity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Satisfaction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSorted.map((benchmark, index) => {
                const isCurrentUser = benchmark.municipality_id === profile?.id;
                const innovationPercentile = getPercentileRank(
                  benchmark.innovation_index,
                  filteredAndSorted.map(b => b.innovation_index)
                );

                return (
                  <tr
                    key={benchmark.id}
                    className={`hover:bg-slate-50 transition ${
                      isCurrentUser ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Award className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-slate-400' :
                            'text-orange-600'
                          }`} />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">
                            {benchmark.municipality_name}
                            {isCurrentUser && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            Rank #{index + 1}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {benchmark.population.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {benchmark.total_projects}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {benchmark.active_solutions}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      ${(benchmark.total_budget / 1000).toFixed(0)}K
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${benchmark.innovation_index}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-8">
                          {benchmark.innovation_index}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Top {100 - innovationPercentile}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                            style={{ width: `${benchmark.digital_maturity}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-8">
                          {benchmark.digital_maturity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                            style={{ width: `${benchmark.satisfaction_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-8">
                          {benchmark.satisfaction_score}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No benchmarks available</p>
        </div>
      )}
    </div>
  );
}

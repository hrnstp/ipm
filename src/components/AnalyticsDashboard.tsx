import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Target,
  Zap,
  Award,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface PlatformStats {
  totalSolutions: number;
  totalProjects: number;
  totalMunicipalities: number;
  totalDevelopers: number;
  totalInvestment: number;
  avgSuccessRate: number;
  activeProjects: number;
  completedProjects: number;
}

interface CategoryData {
  category: string;
  solution_count: number;
  project_count: number;
  avg_success_rate: number;
  total_investment: number;
}

interface TrendData {
  title: string;
  category: string;
  project_count: number;
  municipality_count: number;
  success_rate: number;
  total_investment: number;
}

export default function AnalyticsDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalSolutions: 0,
    totalProjects: 0,
    totalMunicipalities: 0,
    totalDevelopers: 0,
    totalInvestment: 0,
    avgSuccessRate: 0,
    activeProjects: 0,
    completedProjects: 0,
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const [
        solutionsRes,
        projectsRes,
        municipalitiesRes,
        developersRes,
        categoryRes,
        trendsRes,
      ] = await Promise.all([
        supabase.from('smart_solutions').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id, status, budget', { count: 'exact' }),
        supabase.from('municipalities').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'developer'),
        supabase.from('category_performance').select('*'),
        supabase.from('solution_trends').select('*').order('project_count', { ascending: false }).limit(10),
      ]);

      const projects = projectsRes.data || [];
      const completedProjects = projects.filter((p) => p.status === 'completed').length;
      const activeProjects = projects.filter((p) => p.status === 'in_progress').length;
      const totalInvestment = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const successRate = projects.length > 0 ? (completedProjects / projects.length) * 100 : 0;

      setStats({
        totalSolutions: solutionsRes.count || 0,
        totalProjects: projectsRes.count || 0,
        totalMunicipalities: municipalitiesRes.count || 0,
        totalDevelopers: developersRes.count || 0,
        totalInvestment,
        avgSuccessRate: successRate,
        activeProjects,
        completedProjects,
      });

      setCategoryData(categoryRes.data || []);
      setTrendData(trendsRes.data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-themed-secondary">Loading analytics...</div>;
  }

  const topCategories = [...categoryData]
    .sort((a, b) => b.project_count - a.project_count)
    .slice(0, 6);

  const topSolutions = trendData.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-themed-primary flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            Advanced Analytics & Insights
          </h2>
          <p className="text-themed-secondary mt-1">
            Platform-wide metrics, trends, and performance insights
          </p>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Solutions"
          value={stats.totalSolutions}
          icon={Zap}
          color="emerald"
          trend={12}
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={Activity}
          color="blue"
          trend={8}
        />
        <StatCard
          title="Total Investment"
          value={`$${(stats.totalInvestment / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="green"
          trend={15}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.avgSuccessRate.toFixed(1)}%`}
          icon={Target}
          color="purple"
          trend={stats.avgSuccessRate > 75 ? 5 : -3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
          <h3 className="text-lg font-bold text-themed-primary mb-4 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-600" />
            Platform Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-themed-primary rounded-lg border border-themed-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-themed-tertiary">Municipalities</p>
                  <p className="text-xl font-bold text-themed-primary">{stats.totalMunicipalities}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-themed-primary rounded-lg border border-themed-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-themed-tertiary">Developers</p>
                  <p className="text-xl font-bold text-themed-primary">{stats.totalDevelopers}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-themed-primary rounded-lg border border-themed-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-themed-tertiary">Completed Projects</p>
                  <p className="text-xl font-bold text-themed-primary">{stats.completedProjects}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
          <h3 className="text-lg font-bold text-themed-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Top Performing Categories
          </h3>
          <div className="space-y-3">
            {topCategories.map((category, index) => (
              <div key={category.category} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-themed-primary rounded-lg flex items-center justify-center border border-themed-primary">
                  <span className="text-sm font-bold text-themed-primary">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-themed-primary truncate">
                    {category.category}
                  </p>
                  <p className="text-xs text-themed-tertiary">
                    {category.project_count} projects • Success:{' '}
                    {((category.avg_success_rate || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-20 bg-themed-hover rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((category.project_count || 0) / (topCategories[0]?.project_count || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
        <h3 className="text-lg font-bold text-themed-primary mb-4 flex items-center gap-2">
          <Award className="w-6 h-6 text-emerald-600" />
          Top Performing Solutions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-themed-primary">
                <th className="text-left py-3 px-4 text-sm font-semibold text-themed-tertiary">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-themed-tertiary">Solution</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-themed-tertiary">Category</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-themed-tertiary">
                  Projects
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-themed-tertiary">
                  Municipalities
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-themed-tertiary">
                  Success Rate
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-themed-tertiary">
                  Investment
                </th>
              </tr>
            </thead>
            <tbody>
              {topSolutions.map((solution, index) => (
                <tr
                  key={solution.title}
                  className="border-b border-themed-primary hover:bg-themed-hover transition"
                >
                  <td className="py-3 px-4">
                    <div className="w-8 h-8 bg-themed-primary rounded-lg flex items-center justify-center border border-themed-primary">
                      <span className="text-sm font-bold text-emerald-600">{index + 1}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-themed-primary">{solution.title}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-themed-hover text-themed-secondary rounded text-xs">
                      {solution.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-themed-primary">{solution.project_count}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-themed-primary">
                      {solution.municipality_count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (solution.success_rate || 0) > 0.8
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : (solution.success_rate || 0) > 0.6
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {((solution.success_rate || 0) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="font-semibold text-themed-primary">
                      ${((solution.total_investment || 0) / 1000).toFixed(0)}K
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
          <h3 className="text-lg font-bold text-themed-primary mb-4">Investment by Category</h3>
          <div className="space-y-3">
            {topCategories.map((category) => {
              const maxInvestment = Math.max(...topCategories.map((c) => c.total_investment || 0));
              const percentage = maxInvestment > 0 ? ((category.total_investment || 0) / maxInvestment) * 100 : 0;

              return (
                <div key={category.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-themed-primary">{category.category}</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      ${((category.total_investment || 0) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="w-full bg-themed-hover rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
          <h3 className="text-lg font-bold text-themed-primary mb-4">Key Performance Indicators</h3>
          <div className="space-y-4">
            <KPIItem
              label="Average Project Budget"
              value={`$${(stats.totalInvestment / Math.max(stats.totalProjects, 1) / 1000).toFixed(0)}K`}
              trend={8}
            />
            <KPIItem
              label="Projects per Municipality"
              value={(stats.totalProjects / Math.max(stats.totalMunicipalities, 1)).toFixed(1)}
              trend={12}
            />
            <KPIItem
              label="Solutions per Developer"
              value={(stats.totalSolutions / Math.max(stats.totalDevelopers, 1)).toFixed(1)}
              trend={-3}
            />
            <KPIItem
              label="Avg. Solutions per Category"
              value={(stats.totalSolutions / Math.max(categoryData.length, 1)).toFixed(1)}
              trend={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: number;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    blue: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    purple: 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
  };

  const iconColorClasses = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`rounded-xl p-6 border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-8 h-8 ${iconColorClasses[color as keyof typeof iconColorClasses]}`} />
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm font-medium mb-1 opacity-80">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function KPIItem({ label, value, trend }: { label: string; value: string; trend: number }) {
  return (
    <div className="flex items-center justify-between p-3 bg-themed-primary rounded-lg border border-themed-primary">
      <div className="flex-1">
        <p className="text-sm text-themed-tertiary mb-1">{label}</p>
        <p className="text-xl font-bold text-themed-primary">{value}</p>
      </div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
          trend > 0
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}
      >
        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(trend)}%
      </div>
    </div>
  );
}

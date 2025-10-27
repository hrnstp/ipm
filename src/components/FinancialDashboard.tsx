import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  PieChart,
  BarChart3,
} from 'lucide-react';

interface FinancialMetrics {
  totalBudget: number;
  totalSpent: number;
  pendingPayments: number;
  overduePayments: number;
  activeProjects: number;
  completedPayments: number;
}

interface ProjectFinancials {
  id: string;
  title: string;
  budget: number;
  spent: number;
  pending: number;
  currency: string;
}

interface PaymentMilestone {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  project_id: string;
}

export default function FinancialDashboard() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalBudget: 0,
    totalSpent: 0,
    pendingPayments: 0,
    overduePayments: 0,
    activeProjects: 0,
    completedPayments: 0,
  });
  const [projectFinancials, setProjectFinancials] = useState<ProjectFinancials[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<PaymentMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, [profile]);

  const loadFinancialData = async () => {
    if (!profile) return;

    try {
      let projectsQuery = supabase.from('projects').select('id, title, budget');

      if (profile.role === 'developer') {
        projectsQuery = projectsQuery.eq('developer_id', profile.id);
      } else if (profile.role === 'municipality') {
        const { data: munData } = await supabase
          .from('municipalities')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (munData) {
          projectsQuery = projectsQuery.eq('municipality_id', munData.id);
        }
      }

      const { data: projects, error: projectsError } = await projectsQuery;
      if (projectsError) throw projectsError;

      if (!projects || projects.length === 0) {
        setLoading(false);
        return;
      }

      const projectIds = projects.map((p) => p.id);

      const [milestonesRes, transactionsRes] = await Promise.all([
        supabase
          .from('payment_milestones')
          .select('*')
          .in('project_id', projectIds)
          .order('due_date', { ascending: true }),
        supabase.from('financial_transactions').select('*').in('project_id', projectIds),
      ]);

      const milestones = milestonesRes.data || [];
      const transactions = transactionsRes.data || [];

      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const totalSpent = transactions.reduce(
        (sum, t) => sum + (t.transaction_type === 'payment' ? t.amount : 0),
        0
      );
      const pendingMilestones = milestones.filter((m) => m.status === 'pending');
      const pendingPayments = pendingMilestones.reduce((sum, m) => sum + m.amount, 0);

      const now = new Date();
      const overdueMilestones = pendingMilestones.filter(
        (m) => m.due_date && new Date(m.due_date) < now
      );
      const overduePayments = overdueMilestones.reduce((sum, m) => sum + m.amount, 0);

      const completedPayments = milestones.filter((m) => m.status === 'paid').length;
      const activeProjects = projects.filter(
        (p) => milestones.some((m) => m.project_id === p.id && m.status === 'pending')
      ).length;

      setMetrics({
        totalBudget,
        totalSpent,
        pendingPayments,
        overduePayments,
        activeProjects,
        completedPayments,
      });

      const projectFinancialsData: ProjectFinancials[] = projects.map((project) => {
        const projectMilestones = milestones.filter((m) => m.project_id === project.id);
        const projectTransactions = transactions.filter((t) => t.project_id === project.id);

        const spent = projectTransactions.reduce(
          (sum, t) => sum + (t.transaction_type === 'payment' ? t.amount : 0),
          0
        );
        const pending = projectMilestones
          .filter((m) => m.status === 'pending')
          .reduce((sum, m) => sum + m.amount, 0);

        return {
          id: project.id,
          title: project.title,
          budget: project.budget || 0,
          spent,
          pending,
          currency: projectMilestones[0]?.currency || 'USD',
        };
      });

      setProjectFinancials(projectFinancialsData);

      const upcoming = pendingMilestones
        .filter((m) => m.due_date && new Date(m.due_date) >= now)
        .slice(0, 5);
      setUpcomingMilestones(upcoming);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-themed-secondary">Loading financial data...</div>;
  }

  const budgetUtilization = metrics.totalBudget > 0 ? (metrics.totalSpent / metrics.totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-themed-primary flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-emerald-600" />
          Financial Overview
        </h2>
        <p className="text-themed-secondary">Monitor project budgets, spending, and payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">Total Budget</span>
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            ${metrics.totalBudget.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Across {metrics.activeProjects} active projects
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 dark:text-green-300 text-sm font-medium">Total Spent</span>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">
            ${metrics.totalSpent.toLocaleString()}
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-green-600 dark:text-green-400">Budget utilization</span>
              <span className="text-green-700 dark:text-green-300 font-semibold">
                {budgetUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5">
              <div
                className="bg-green-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
              Pending Payments
            </span>
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
            ${metrics.pendingPayments.toLocaleString()}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            {upcomingMilestones.length} upcoming milestones
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-700 dark:text-red-300 text-sm font-medium">Overdue</span>
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900 dark:text-red-100">
            ${metrics.overduePayments.toLocaleString()}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">Requires immediate attention</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
          <h3 className="text-lg font-bold text-themed-primary mb-4 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-600" />
            Project Budgets
          </h3>

          {projectFinancials.length === 0 ? (
            <div className="text-center py-8 text-themed-secondary">
              <p>No project financial data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectFinancials.map((project) => {
                const utilization = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
                const remaining = project.budget - project.spent - project.pending;

                return (
                  <div key={project.id} className="bg-themed-primary border border-themed-primary rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-themed-primary">{project.title}</h4>
                      <span className="text-sm font-medium text-themed-secondary">
                        {project.currency} {project.budget.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">Spent</span>
                        <span className="font-medium text-themed-primary">
                          {project.currency} {project.spent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                        <span className="font-medium text-themed-primary">
                          {project.currency} {project.pending.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-themed-tertiary">Remaining</span>
                        <span className="font-medium text-themed-primary">
                          {project.currency} {remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-themed-tertiary">Utilization</span>
                        <span className="font-semibold text-themed-primary">{utilization.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-themed-hover rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            utilization > 90
                              ? 'bg-red-600'
                              : utilization > 70
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
          <h3 className="text-lg font-bold text-themed-primary mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Upcoming Payment Milestones
          </h3>

          {upcomingMilestones.length === 0 ? (
            <div className="text-center py-8 text-themed-secondary">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p>No upcoming payment milestones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMilestones.map((milestone) => {
                const daysUntil = Math.ceil(
                  (new Date(milestone.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={milestone.id}
                    className="bg-themed-primary border border-themed-primary rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-themed-primary">{milestone.title}</h4>
                      <span className="text-sm font-bold text-emerald-600">
                        {milestone.currency} {milestone.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-themed-secondary">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(milestone.due_date).toLocaleDateString()}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          daysUntil <= 7
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : daysUntil <= 30
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        }`}
                      >
                        {daysUntil} days
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
        <h3 className="text-lg font-bold text-themed-primary mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-themed-tertiary text-sm mb-1">Total Projects</p>
            <p className="text-3xl font-bold text-themed-primary">{projectFinancials.length}</p>
          </div>
          <div className="text-center">
            <p className="text-themed-tertiary text-sm mb-1">Completed Payments</p>
            <p className="text-3xl font-bold text-green-600">{metrics.completedPayments}</p>
          </div>
          <div className="text-center">
            <p className="text-themed-tertiary text-sm mb-1">Available Budget</p>
            <p className="text-3xl font-bold text-blue-600">
              ${(metrics.totalBudget - metrics.totalSpent).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

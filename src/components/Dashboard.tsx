import { useState, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import {
  Search,
  Users,
  FolderOpen,
  Mail,
  DollarSign,
  Calculator,
  Lightbulb,
  FileText,
  Award,
  Briefcase,
  BarChart3,
  Target,
  Calendar,
  CheckSquare,
  Workflow,
  Shield,
  ShieldCheck,
  Lock,
  Globe2,
  TrendingUp,
} from 'lucide-react';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardStats } from './dashboard/DashboardStats';
import { DashboardTabs, type TabConfig } from './dashboard/DashboardTabs';

// Lazy load all feature components for better performance
const SolutionsMarketplace = lazy(() => import('./SolutionsMarketplace'));
const ConnectionsManager = lazy(() => import('./ConnectionsManager'));
const ProjectsManager = lazy(() => import('./ProjectsManager'));
const ProfileManager = lazy(() => import('./ProfileManager'));
const MessagingSystem = lazy(() => import('./MessagingSystem'));
const FundingOpportunities = lazy(() => import('./FundingOpportunities'));
const BudgetPlanner = lazy(() => import('./BudgetPlanner'));
const FinancialDashboard = lazy(() => import('./FinancialDashboard'));
const ProcurementRFP = lazy(() => import('./ProcurementRFP'));
const VendorRatings = lazy(() => import('./VendorRatings'));
const ContractTemplates = lazy(() => import('./ContractTemplates'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const ROICalculator = lazy(() => import('./ROICalculator'));
const BenchmarkingTool = lazy(() => import('./BenchmarkingTool'));
const ProjectTimeline = lazy(() => import('./ProjectTimeline'));
const TaskManager = lazy(() => import('./TaskManager'));
const DocumentManager = lazy(() => import('./DocumentManager'));
const WorkflowAutomation = lazy(() => import('./WorkflowAutomation'));
const SecurityAuditLog = lazy(() => import('./SecurityAuditLog'));
const ComplianceTracker = lazy(() => import('./ComplianceTracker'));
const DataPrivacy = lazy(() => import('./DataPrivacy'));
const SecurityManagement = lazy(() => import('./SecurityManagement'));

type Tab = 'marketplace' | 'connections' | 'projects' | 'messages' | 'profile' | 'funding' | 'budget' | 'financial' | 'rfp' | 'ratings' | 'contracts' | 'analytics' | 'roi' | 'benchmarks' | 'timeline' | 'tasks' | 'documents' | 'workflows' | 'audit' | 'compliance' | 'privacy' | 'security';

// Loading fallback component for lazy-loaded features
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-themed-secondary">Loading...</div>
    </div>
  );
}

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('marketplace');
  const { stats } = useDashboardStats(profile);

  const tabs = [
    { id: 'marketplace' as const, label: 'Solutions', icon: Search, show: true },
    { id: 'rfp' as const, label: 'RFPs', icon: FileText, show: true },
    { id: 'funding' as const, label: 'Funding', icon: Lightbulb, show: true },
    { id: 'connections' as const, label: 'Connections', icon: Users, show: true },
    { id: 'projects' as const, label: 'Projects', icon: FolderOpen, show: true },
    { id: 'timeline' as const, label: 'Timeline', icon: Calendar, show: true },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, show: true },
    { id: 'documents' as const, label: 'Documents', icon: FileText, show: true },
    { id: 'workflows' as const, label: 'Workflows', icon: Workflow, show: true },
    { id: 'audit' as const, label: 'Audit Log', icon: Shield, show: true },
    { id: 'compliance' as const, label: 'Compliance', icon: ShieldCheck, show: true },
    { id: 'privacy' as const, label: 'Privacy', icon: Lock, show: true },
    { id: 'security' as const, label: 'Security', icon: Shield, show: true },
    { id: 'financial' as const, label: 'Financials', icon: DollarSign, show: profile?.role === 'municipality' || profile?.role === 'developer' },
    { id: 'budget' as const, label: 'Budget', icon: Calculator, show: profile?.role === 'municipality' || profile?.role === 'developer' },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, show: true },
    { id: 'roi' as const, label: 'ROI Calculator', icon: TrendingUp, show: profile?.role === 'municipality' },
    { id: 'benchmarks' as const, label: 'Benchmarks', icon: Target, show: profile?.role === 'municipality' },
    { id: 'ratings' as const, label: 'Ratings', icon: Award, show: true },
    { id: 'contracts' as const, label: 'Contracts', icon: Briefcase, show: true },
    { id: 'messages' as const, label: 'Messages', icon: Mail, show: true },
    { id: 'profile' as const, label: 'Profile', icon: Globe2, show: true },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <DashboardHeader
        organizationName={profile?.organization}
        userRole={profile?.role}
        onSignOut={signOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats stats={stats} />

        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden">
          <DashboardTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="p-6">
            <Suspense fallback={<LoadingFallback />}>
              {activeTab === 'marketplace' && <SolutionsMarketplace />}
              {activeTab === 'rfp' && <ProcurementRFP />}
              {activeTab === 'funding' && <FundingOpportunities />}
              {activeTab === 'connections' && <ConnectionsManager />}
              {activeTab === 'projects' && <ProjectsManager />}
              {activeTab === 'timeline' && <ProjectTimeline />}
              {activeTab === 'tasks' && <TaskManager />}
              {activeTab === 'documents' && <DocumentManager />}
              {activeTab === 'workflows' && <WorkflowAutomation />}
              {activeTab === 'audit' && <SecurityAuditLog />}
              {activeTab === 'compliance' && <ComplianceTracker />}
              {activeTab === 'privacy' && <DataPrivacy />}
              {activeTab === 'security' && <SecurityManagement />}
              {activeTab === 'financial' && <FinancialDashboard />}
              {activeTab === 'budget' && <BudgetPlanner />}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
              {activeTab === 'roi' && <ROICalculator />}
              {activeTab === 'benchmarks' && <BenchmarkingTool />}
              {activeTab === 'ratings' && <VendorRatings />}
              {activeTab === 'contracts' && <ContractTemplates />}
              {activeTab === 'messages' && <MessagingSystem />}
              {activeTab === 'profile' && <ProfileManager />}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

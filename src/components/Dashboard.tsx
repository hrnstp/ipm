import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Globe2, LogOut, Search, Plus, MessageSquare, Users, FolderOpen, TrendingUp, Mail, DollarSign, Calculator, Lightbulb, FileText, Award, Briefcase, BarChart3, Target, Calendar, CheckSquare, Workflow, Shield, ShieldCheck, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// Lazy load all components for better performance
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

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

type Tab = 'marketplace' | 'connections' | 'projects' | 'messages' | 'profile' | 'funding' | 'budget' | 'financial' | 'rfp' | 'ratings' | 'contracts' | 'analytics' | 'roi' | 'benchmarks' | 'timeline' | 'tasks' | 'documents' | 'workflows' | 'audit' | 'compliance' | 'privacy' | 'security';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('marketplace');
  const [stats, setStats] = useState({
    solutions: 0,
    connections: 0,
    projects: 0,
    municipalities: 0,
  });
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    loadStats();
  }, [profile]);

  useEffect(() => {
    const checkScrollButtons = () => {
      if (!tabsContainerRef.current) return;
      const container = tabsContainerRef.current;
      const hasOverflow = container.scrollWidth > container.clientWidth;
      setShowLeftArrow(hasOverflow && container.scrollLeft > 0);
      setShowRightArrow(
        hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    const container = tabsContainerRef.current;
    if (container) {
      // Initial check after a short delay to ensure DOM is ready
      setTimeout(checkScrollButtons, 100);
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [profile]); // Re-check when profile changes (affects visible tabs)

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsContainerRef.current) return;
    const container = tabsContainerRef.current;
    const scrollAmount = 300;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const loadStats = async () => {
    if (!profile) return;

    try {
      const [solutionsRes, connectionsRes, projectsRes, municipalitiesRes] = await Promise.all([
        supabase.from('smart_solutions').select('id', { count: 'exact', head: true }),
        supabase.from('connections').select('id', { count: 'exact', head: true })
          .or(`initiator_id.eq.${profile.id},recipient_id.eq.${profile.id}`),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('municipalities').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        solutions: solutionsRes.count || 0,
        connections: connectionsRes.count || 0,
        projects: projectsRes.count || 0,
        municipalities: municipalitiesRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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
      <nav className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#1a1a1a] sticky top-0 z-50 backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Globe2 className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">CityMind AI</h1>
                <p className="text-xs text-gray-500 dark:text-gray-500">{profile?.organization}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-medium rounded-full capitalize">
                {profile?.role}
              </span>
              <ThemeToggle />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Solutions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.solutions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Connections</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.connections}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Projects</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.projects}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Municipalities</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.municipalities}</p>
              </div>
              <Globe2 className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden">
          <div className="border-b border-gray-200 dark:border-[#1a1a1a] relative">
            {/* Left gradient fade */}
            {showLeftArrow && (
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-[#111111] to-transparent pointer-events-none z-10" />
            )}

            {/* Right gradient fade */}
            {showRightArrow && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-[#111111] to-transparent pointer-events-none z-10" />
            )}

            {/* Left scroll arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scrollTabs('left')}
                className="absolute left-0 top-0 bottom-0 z-20 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-sm px-3 flex items-center hover:bg-white dark:hover:bg-[#111111] transition shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            {/* Right scroll arrow */}
            {showRightArrow && (
              <button
                onClick={() => scrollTabs('right')}
                className="absolute right-0 top-0 bottom-0 z-20 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-sm px-3 flex items-center hover:bg-white dark:hover:bg-[#111111] transition shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            <nav 
              ref={tabsContainerRef}
              className="flex overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tabs.filter(t => t.show).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Scroll active tab into view
                    setTimeout(() => {
                      const button = tabsContainerRef.current?.querySelector(
                        `button[data-tab-id="${tab.id}"]`
                      ) as HTMLElement;
                      if (button) {
                        button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }
                    }, 100);
                  }}
                  data-tab-id={tab.id}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

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

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Search, Users, FolderOpen, TrendingUp, Mail, 
  DollarSign, Calculator, Lightbulb, FileText, Award, Briefcase, 
  BarChart3, Target, Calendar, CheckSquare, Workflow, Shield, 
  ShieldCheck, Lock, Sparkles, User, Settings
} from 'lucide-react';
import { isValidUUID } from '../shared/utils/validators';

// Navigation components
import TopNavBar from './navigation/TopNavBar';
import ContextualSidebar from './navigation/ContextualSidebar';
import GlobalSearch from './navigation/GlobalSearch';

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
const SettingsPage = lazy(() => import('./Settings'));

// Skeleton loading component
const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      ))}
    </div>
  </div>
);

type Tab = 'marketplace' | 'connections' | 'projects' | 'messages' | 'profile' | 'funding' | 'budget' | 'financial' | 'rfp' | 'ratings' | 'contracts' | 'analytics' | 'roi' | 'benchmarks' | 'timeline' | 'tasks' | 'documents' | 'workflows' | 'audit' | 'compliance' | 'privacy' | 'security' | 'settings';

// Define section structure
const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'network', label: 'Network' },
  { id: 'projects', label: 'Projects' },
  { id: 'finance', label: 'Finance' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'security', label: 'Security' },
];

// Map sections to their sidebar items
const getSectionItems = (sectionId: string, profile: any, unreadMessages: number) => {
  const itemsMap: Record<string, { id: Tab; label: string; icon: any; show: boolean; badge?: number }[]> = {
    overview: [
      { id: 'marketplace', label: 'Solutions', icon: Sparkles, show: true },
      { id: 'rfp', label: 'RFP Listings', icon: FileText, show: true },
      { id: 'funding', label: 'Funding', icon: Lightbulb, show: true },
    ],
    network: [
      { id: 'connections', label: 'Connections', icon: Users, show: true },
      { id: 'messages', label: 'Messages', icon: Mail, show: true, badge: unreadMessages },
      { id: 'ratings', label: 'Vendor Ratings', icon: Award, show: true },
    ],
    projects: [
      { id: 'projects', label: 'All Projects', icon: FolderOpen, show: true },
      { id: 'timeline', label: 'Timeline', icon: Calendar, show: true },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare, show: true },
      { id: 'documents', label: 'Documents', icon: FileText, show: true },
      { id: 'workflows', label: 'Workflows', icon: Workflow, show: true },
    ],
    finance: [
      { id: 'financial', label: 'Dashboard', icon: DollarSign, show: profile?.role === 'municipality' || profile?.role === 'developer' },
      { id: 'budget', label: 'Budget Planner', icon: Calculator, show: profile?.role === 'municipality' || profile?.role === 'developer' },
      { id: 'contracts', label: 'Contracts', icon: Briefcase, show: true },
    ],
    analytics: [
      { id: 'analytics', label: 'Overview', icon: BarChart3, show: true },
      { id: 'roi', label: 'ROI Calculator', icon: TrendingUp, show: profile?.role === 'municipality' },
      { id: 'benchmarks', label: 'Benchmarks', icon: Target, show: profile?.role === 'municipality' },
    ],
    security: [
      { id: 'security', label: 'Overview', icon: Shield, show: true },
      { id: 'audit', label: 'Audit Log', icon: Shield, show: true },
      { id: 'compliance', label: 'Compliance', icon: ShieldCheck, show: true },
      { id: 'privacy', label: 'Privacy', icon: Lock, show: true },
    ],
  };

  return (itemsMap[sectionId] || []).filter(item => item.show);
};

// Find which section contains a tab
const findSectionForTab = (tab: Tab): string => {
  const sectionMap: Record<Tab, string> = {
    marketplace: 'overview',
    rfp: 'overview',
    funding: 'overview',
    connections: 'network',
    messages: 'network',
    ratings: 'network',
    projects: 'projects',
    timeline: 'projects',
    tasks: 'projects',
    documents: 'projects',
    workflows: 'projects',
    financial: 'finance',
    budget: 'finance',
    contracts: 'finance',
    analytics: 'analytics',
    roi: 'analytics',
    benchmarks: 'analytics',
    security: 'security',
    audit: 'security',
    compliance: 'security',
    privacy: 'security',
    settings: 'overview',
    profile: 'overview',
  };
  return sectionMap[tab] || 'overview';
};

export default function Dashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('marketplace');
  const [activeSection, setActiveSection] = useState('overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Load unread messages count
  useEffect(() => {
    const loadUnreadMessages = async () => {
      if (!profile?.id || !isValidUUID(profile.id)) return;

      try {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', profile.id)
          .eq('read', false);

        setUnreadMessages(count || 0);
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }
    };

    loadUnreadMessages();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(loadUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update section when tab changes
  useEffect(() => {
    setActiveSection(findSectionForTab(activeTab));
  }, [activeTab]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    // Set first item of section as active tab
    const items = getSectionItems(sectionId, profile, unreadMessages);
    if (items.length > 0) {
      setActiveTab(items[0].id);
    }
  };

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab as Tab);
  }, []);

  const sidebarItems = getSectionItems(activeSection, profile, unreadMessages);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Top Navigation Bar */}
      <TopNavBar
        sections={SECTIONS}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onSearchOpen={() => setIsSearchOpen(true)}
        onNavigate={handleNavigate}
        unreadCount={unreadMessages}
      />

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Main content area */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Contextual Sidebar */}
          <ContextualSidebar
            title={SECTIONS.find(s => s.id === activeSection)?.label || ''}
            items={sidebarItems}
            activeItem={activeTab}
            onItemClick={(itemId) => setActiveTab(itemId as Tab)}
          />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="p-6">
                <Suspense fallback={<SkeletonLoader />}>
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
                  {activeTab === 'settings' && <SettingsPage />}
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Globe2, LogOut, Search, Plus, MessageSquare, Users, FolderOpen, TrendingUp, Mail } from 'lucide-react';
import SolutionsMarketplace from './SolutionsMarketplace';
import ConnectionsManager from './ConnectionsManager';
import ProjectsManager from './ProjectsManager';
import ProfileManager from './ProfileManager';
import MessagingSystem from './MessagingSystem';
import ThemeToggle from './ThemeToggle';

type Tab = 'marketplace' | 'connections' | 'projects' | 'messages' | 'profile';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('marketplace');
  const [stats, setStats] = useState({
    solutions: 0,
    connections: 0,
    projects: 0,
    municipalities: 0,
  });

  useEffect(() => {
    loadStats();
  }, [profile]);

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
    { id: 'connections' as const, label: 'Connections', icon: Users, show: true },
    { id: 'projects' as const, label: 'Projects', icon: FolderOpen, show: true },
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
          <div className="border-b border-gray-200 dark:border-[#1a1a1a]">
            <nav className="flex">
              {tabs.filter(t => t.show).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
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
            {activeTab === 'marketplace' && <SolutionsMarketplace />}
            {activeTab === 'connections' && <ConnectionsManager />}
            {activeTab === 'projects' && <ProjectsManager />}
            {activeTab === 'messages' && <MessagingSystem />}
            {activeTab === 'profile' && <ProfileManager />}
          </div>
        </div>
      </div>
    </div>
  );
}

import { LucideIcon } from 'lucide-react';

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
}

interface DashboardTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function DashboardTabs({ tabs, activeTab, onTabChange }: DashboardTabsProps) {
  const visibleTabs = tabs.filter((tab) => tab.show);

  return (
    <div className="border-b border-gray-200 dark:border-[#1a1a1a]">
      <nav className="flex overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
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
  );
}

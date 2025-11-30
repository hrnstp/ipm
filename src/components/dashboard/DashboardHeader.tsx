import { Globe2, LogOut } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

interface DashboardHeaderProps {
  organizationName?: string;
  userRole?: string;
  onSignOut: () => Promise<void>;
}

export function DashboardHeader({ organizationName, userRole, onSignOut }: DashboardHeaderProps) {
  return (
    <nav className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#1a1a1a] sticky top-0 z-50 backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">CityMind AI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-500">{organizationName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userRole && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-medium rounded-full capitalize">
                {userRole}
              </span>
            )}
            <ThemeToggle />
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

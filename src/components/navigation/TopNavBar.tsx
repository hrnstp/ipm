import { Globe2, Search, Bell, Command, Menu } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import UserMenu from './UserMenu';

interface NavSection {
  id: string;
  label: string;
}

interface TopNavBarProps {
  sections: NavSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  onSearchOpen: () => void;
  onNavigate: (tab: string) => void;
  onMobileMenuOpen?: () => void;
  unreadCount?: number;
}

export default function TopNavBar({
  sections,
  activeSection,
  onSectionChange,
  onSearchOpen,
  onNavigate,
  onMobileMenuOpen,
  unreadCount = 0,
}: TopNavBarProps) {
  return (
    <nav className="bg-slate-900 dark:bg-[#0a0a0a] border-b border-slate-800 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo + Search + Navigation */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Mobile menu button */}
            {onMobileMenuOpen && (
              <button
                onClick={onMobileMenuOpen}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Globe2 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-display font-bold text-white leading-tight">UrbanLink</h1>
                <p className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">Smart City</p>
              </div>
            </div>

            {/* Search button */}
            <button
              onClick={onSearchOpen}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-slate-400 hover:text-slate-200 transition-all w-48 lg:w-64"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm flex-1 text-left truncate">Search...</span>
              <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-700 dark:bg-gray-700 rounded text-[10px] text-slate-400">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>

            {/* Main navigation sections */}
            <div className="hidden lg:flex items-center gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeSection === section.id
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side: Notifications + Theme + User */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button 
              onClick={() => onNavigate('messages')}
              className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Theme toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* User menu */}
            <UserMenu onNavigate={onNavigate} />
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="lg:hidden pb-3 -mx-2 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}


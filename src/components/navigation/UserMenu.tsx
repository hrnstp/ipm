import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, ChevronDown, Building2, Shield } from 'lucide-react';

interface UserMenuProps {
  onNavigate: (tab: string) => void;
}

export default function UserMenu({ onNavigate }: UserMenuProps) {
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'municipality':
        return 'from-blue-500 to-indigo-600';
      case 'developer':
        return 'from-teal-500 to-emerald-600';
      case 'integrator':
        return 'from-violet-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'municipality':
        return Building2;
      case 'developer':
        return Settings;
      case 'integrator':
        return Shield;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon(profile?.role || '');

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getRoleColor(profile?.role || '')} flex items-center justify-center shadow-lg`}>
          <span className="text-white font-semibold text-sm">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>

        {/* User info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {profile?.organization || 'Organization'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {profile?.role || 'User'}
          </p>
        </div>

        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-scale-in z-50">
          {/* User header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(profile?.role || '')} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-lg">
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Organization info */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <RoleIcon className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {profile?.organization}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {profile?.country}, {profile?.region}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <button
              onClick={() => {
                onNavigate('profile');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">View Profile</span>
            </button>

            <button
              onClick={() => {
                onNavigate('security');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Security Settings</span>
            </button>
          </div>

          {/* Sign out */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


import { LucideIcon } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface ContextualSidebarProps {
  title: string;
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

export default function ContextualSidebar({ title, items, activeItem, onItemClick }: ContextualSidebarProps) {
  if (items.length === 0) return null;

  return (
    <aside className="w-56 flex-shrink-0 hidden md:block">
      <div className="sticky top-24">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Section title */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h2>
          </div>

          {/* Navigation items */}
          <nav className="p-2">
            {items.map((item, index) => {
              const isActive = activeItem === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 mb-0.5 group ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                    }`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}


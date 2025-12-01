import { X } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useEffect } from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  title,
  items,
  activeItem,
  onItemClick,
}: MobileSidebarProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (itemId: string) => {
    onItemClick(itemId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar drawer */}
      <aside
        className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 z-50 md:hidden shadow-2xl animate-slide-in-left"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {items.map((item, index) => {
            const isActive = activeItem === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}


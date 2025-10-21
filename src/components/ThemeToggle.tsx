import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg transition-colors hover:bg-themed-hover focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-6 h-6">
        <Sun
          className={`absolute inset-0 w-6 h-6 text-themed-secondary transition-all duration-300 ${
            theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'
          }`}
          aria-hidden="true"
        />
        <Moon
          className={`absolute inset-0 w-6 h-6 text-themed-secondary transition-all duration-300 ${
            theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
          }`}
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">
        {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      </span>
    </button>
  );
}

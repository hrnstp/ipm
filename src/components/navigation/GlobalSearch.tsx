import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Users, FolderOpen, Lightbulb, ArrowRight, Command } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SearchResult {
  id: string;
  type: 'solution' | 'project' | 'connection' | 'rfp';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !profile) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchTerm = `%${searchQuery}%`;

      // Search in parallel
      const [solutionsRes, projectsRes, rfpsRes] = await Promise.all([
        supabase
          .from('smart_solutions')
          .select('id, title, category')
          .ilike('title', searchTerm)
          .limit(5),
        supabase
          .from('projects')
          .select('id, title, status')
          .ilike('title', searchTerm)
          .limit(5),
        supabase
          .from('rfp_requests')
          .select('id, title, category')
          .ilike('title', searchTerm)
          .limit(5),
      ]);

      const allResults: SearchResult[] = [
        ...(solutionsRes.data || []).map(s => ({
          id: s.id,
          type: 'solution' as const,
          title: s.title,
          subtitle: s.category,
          icon: Lightbulb,
        })),
        ...(projectsRes.data || []).map(p => ({
          id: p.id,
          type: 'project' as const,
          title: p.title,
          subtitle: `Status: ${p.status}`,
          icon: FolderOpen,
        })),
        ...(rfpsRes.data || []).map(r => ({
          id: r.id,
          type: 'rfp' as const,
          title: r.title,
          subtitle: r.category,
          icon: FileText,
        })),
      ];

      setResults(allResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results.length]);

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'solution':
        onNavigate('marketplace');
        break;
      case 'project':
        onNavigate('projects');
        break;
      case 'rfp':
        onNavigate('rfp');
        break;
      case 'connection':
        onNavigate('connections');
        break;
    }
    onClose();
  };

  const quickActions = [
    { label: 'Browse Solutions', icon: Lightbulb, action: () => { onNavigate('marketplace'); onClose(); } },
    { label: 'View Projects', icon: FolderOpen, action: () => { onNavigate('projects'); onClose(); } },
    { label: 'My Connections', icon: Users, action: () => { onNavigate('connections'); onClose(); } },
    { label: 'RFP Listings', icon: FileText, action: () => { onNavigate('rfp'); onClose(); } },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-scale-in">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-800">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search solutions, projects, RFPs..."
              className="flex-1 py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none text-lg"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-500">
              <span>ESC</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : query && results.length > 0 ? (
              <div ref={resultsRef} className="p-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      index === selectedIndex
                        ? 'bg-teal-100 dark:bg-teal-900/50'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <result.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${index === selectedIndex ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                ))}
              </div>
            ) : query && !loading ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              /* Quick actions when no query */
              <div className="p-4">
                <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</p>
                <div className="space-y-1">
                  {quickActions.map((action, index) => (
                    <button
                      key={action.label}
                      onClick={action.action}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <action.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
                to select
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>K to search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


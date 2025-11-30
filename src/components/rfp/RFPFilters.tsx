// Компонент фильтров RFP

interface RFPFiltersProps {
  filter: 'all' | 'published' | 'closed';
  searchTerm: string;
  onFilterChange: (filter: 'all' | 'published' | 'closed') => void;
  onSearchChange: (term: string) => void;
}

export default function RFPFilters({ filter, searchTerm, onFilterChange, onSearchChange }: RFPFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search RFPs..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
              : 'bg-themed-hover text-themed-secondary'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onFilterChange('published')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'published'
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
              : 'bg-themed-hover text-themed-secondary'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => onFilterChange('closed')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'closed'
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
              : 'bg-themed-hover text-themed-secondary'
          }`}
        >
          Closed
        </button>
      </div>
    </div>
  );
}


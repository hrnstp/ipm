import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DollarSign, Calendar, Globe, BookOpen, ExternalLink, Filter, Search, TrendingUp, Lightbulb } from 'lucide-react';

interface FundingOpportunity {
  id: string;
  title: string;
  provider: string;
  type: string;
  amount_min: number;
  amount_max: number;
  currency: string;
  eligible_regions: string[];
  eligible_categories: string[];
  description: string;
  requirements: string[];
  deadline: string;
  application_url: string;
  status: string;
  created_at: string;
}

export default function FundingOpportunities() {
  const { profile } = useAuth();
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<FundingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<FundingOpportunity | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    filterOpportunities();
  }, [searchTerm, typeFilter, regionFilter, opportunities]);

  const loadOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('funding_opportunities')
        .select('*')
        .eq('status', 'active')
        .order('deadline', { ascending: true });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error loading funding opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOpportunities = () => {
    let filtered = opportunities;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.title.toLowerCase().includes(search) ||
          opp.provider.toLowerCase().includes(search) ||
          opp.description.toLowerCase().includes(search)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((opp) => opp.type === typeFilter);
    }

    if (regionFilter !== 'all') {
      filtered = filtered.filter((opp) => opp.eligible_regions.includes(regionFilter));
    }

    setFilteredOpportunities(filtered);
  };

  const formatAmount = (min: number, max: number, currency: string) => {
    const format = (amount: number) => {
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
      return amount.toString();
    };

    return `${currency} ${format(min)} - ${format(max)}`;
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const fundingTypes = Array.from(new Set(opportunities.map((o) => o.type)));
  const regions = Array.from(new Set(opportunities.flatMap((o) => o.eligible_regions)));

  if (loading) {
    return <div className="text-center py-12 text-themed-secondary">Loading funding opportunities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Funding Opportunities</h2>
        </div>
        <p className="text-emerald-100">
          Discover grants, loans, and financial support for your smart city projects
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-emerald-100 text-sm mb-1">Active Opportunities</p>
            <p className="text-3xl font-bold">{opportunities.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-emerald-100 text-sm mb-1">Total Funding Available</p>
            <p className="text-3xl font-bold">
              ${(opportunities.reduce((sum, o) => sum + o.amount_max, 0) / 1000000).toFixed(1)}M+
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-emerald-100 text-sm mb-1">Funding Types</p>
            <p className="text-3xl font-bold">{fundingTypes.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-themed-tertiary w-5 h-5" />
          <input
            type="text"
            placeholder="Search funding opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
        >
          <option value="all">All Types</option>
          {fundingTypes.map((type) => (
            <option key={type} value={type} className="capitalize">
              {type}
            </option>
          ))}
        </select>

        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
        >
          <option value="all">All Regions</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOpportunities.map((opportunity) => {
          const daysLeft = getDaysUntilDeadline(opportunity.deadline);
          return (
            <div
              key={opportunity.id}
              className="bg-themed-secondary border border-themed-primary rounded-xl p-6 hover:shadow-lg transition cursor-pointer group"
              onClick={() => setSelectedOpportunity(opportunity)}
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                    opportunity.type === 'grant'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : opportunity.type === 'loan'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                  }`}
                >
                  {opportunity.type}
                </span>
                {daysLeft <= 30 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded text-xs font-medium">
                    {daysLeft}d left
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-themed-primary mb-2 group-hover:text-emerald-600 transition">
                {opportunity.title}
              </h3>
              <p className="text-sm text-themed-secondary mb-4">{opportunity.provider}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-themed-secondary">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">
                    {formatAmount(opportunity.amount_min, opportunity.amount_max, opportunity.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-themed-secondary">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{new Date(opportunity.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-sm text-themed-secondary line-clamp-2 mb-4">{opportunity.description}</p>

              <div className="pt-4 border-t border-themed-primary">
                <p className="text-xs text-themed-tertiary mb-2">Eligible for:</p>
                <div className="flex flex-wrap gap-1">
                  {opportunity.eligible_categories.slice(0, 2).map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-themed-hover text-themed-secondary rounded text-xs"
                    >
                      {cat}
                    </span>
                  ))}
                  {opportunity.eligible_categories.length > 2 && (
                    <span className="px-2 py-1 bg-themed-hover text-themed-secondary rounded text-xs">
                      +{opportunity.eligible_categories.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-themed-tertiary mx-auto mb-4" />
          <p className="text-themed-secondary">No funding opportunities found matching your criteria</p>
        </div>
      )}

      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}

function OpportunityDetailModal({
  opportunity,
  onClose,
}: {
  opportunity: FundingOpportunity;
  onClose: () => void;
}) {
  const daysLeft = Math.ceil(
    (new Date(opportunity.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-themed-secondary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
        <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-start z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium uppercase ${
                  opportunity.type === 'grant'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : opportunity.type === 'loan'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                }`}
              >
                {opportunity.type}
              </span>
              {daysLeft <= 30 && (
                <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full text-sm font-medium">
                  {daysLeft} days remaining
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-themed-primary mb-1">{opportunity.title}</h2>
            <p className="text-themed-secondary">{opportunity.provider}</p>
          </div>
          <button
            onClick={onClose}
            className="text-themed-tertiary hover:text-themed-primary transition ml-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-themed-primary">Funding Amount</h3>
              </div>
              <p className="text-2xl font-bold text-themed-primary">
                {opportunity.currency} {opportunity.amount_min.toLocaleString()} -{' '}
                {opportunity.amount_max.toLocaleString()}
              </p>
            </div>

            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-themed-primary">Application Deadline</h3>
              </div>
              <p className="text-xl font-bold text-themed-primary">
                {new Date(opportunity.deadline).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-themed-primary mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Description
            </h3>
            <p className="text-themed-secondary leading-relaxed">{opportunity.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-themed-primary mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Eligible Regions
            </h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.eligible_regions.map((region, idx) => (
                <span
                  key={idx}
                  className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-medium"
                >
                  {region}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-themed-primary mb-3">Eligible Categories</h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.eligible_categories.map((category, idx) => (
                <span
                  key={idx}
                  className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {opportunity.requirements && opportunity.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-themed-primary mb-3">Application Requirements</h3>
              <ul className="space-y-2">
                {opportunity.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-themed-secondary">
                    <svg
                      className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-themed-primary">
            <a
              href={opportunity.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium w-full md:w-auto"
            >
              <ExternalLink className="w-5 h-5" />
              Apply Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

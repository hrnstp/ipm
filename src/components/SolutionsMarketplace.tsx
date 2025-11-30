import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SmartSolution, Profile } from '../lib/supabase';
import { Search, Filter, Plus, X, Sparkles, TrendingUp, MapPin, Clock, Zap, Eye, MessageCircle, Star, Users as UsersIcon, FileText, ExternalLink } from 'lucide-react';
import { solutionService } from '../shared/services/solutionService';
import { connectionService } from '../shared/services/connectionService';
import { useErrorHandler } from '../shared/hooks/useErrorHandler';
import { useToast } from '../shared/hooks/useToast';
import { useValidatedForm } from '../shared/hooks/useValidatedForm';
import { createSolutionSchema, type CreateSolutionInput } from '../shared/validation/schemas/solutionSchema';

export default function SolutionsMarketplace() {
  const { profile } = useAuth();
  const handleError = useErrorHandler();
  const { showSuccess, showError } = useToast();
  const [solutions, setSolutions] = useState<(SmartSolution & { developer: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [maturityFilter, setMaturityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<(SmartSolution & { developer: Profile }) | null>(null);

  const categories = [
    'Traffic Management',
    'Energy & Utilities',
    'Water Management',
    'Waste Management',
    'Public Safety',
    'Environmental Monitoring',
    'Citizen Services',
    'Infrastructure',
  ];

  useEffect(() => {
    loadSolutions();
  }, [categoryFilter, maturityFilter]);

  const loadSolutions = async () => {
    try {
      setLoading(true);
      const { data, error } = await solutionService.getSolutions({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        maturity_level: maturityFilter !== 'all' ? maturityFilter as any : undefined,
      });

      if (error) throw error;
      setSolutions(data || []);
    } catch (error) {
      handleError(error, 'Failed to load solutions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSolutions = solutions.filter((solution) => {
    const matchesSearch = solution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         solution.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || solution.category === categoryFilter;
    const matchesMaturity = maturityFilter === 'all' || solution.maturity_level === maturityFilter;
    return matchesSearch && matchesCategory && matchesMaturity;
  });

  const CreateSolutionModal = () => {
    const form = useValidatedForm<CreateSolutionInput>(createSolutionSchema, {
      category: categories[0],
      maturity_level: 'prototype',
      technologies: [],
      target_regions: [],
      case_studies: [],
      requirements: {},
    });

    const handleSubmit = async (data: CreateSolutionInput) => {
      if (!profile?.id) {
        showError('You must be logged in to create a solution');
        return;
      }

      try {
        const { data: solution, error } = await solutionService.createSolution({
          ...data,
          developer_id: profile.id,
        });

        if (error) throw error;

        showSuccess('Solution created successfully!');
        await loadSolutions();
        setShowCreateModal(false);
        form.reset();
      } catch (error) {
        handleError(error, 'Failed to create solution');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-[#111111] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-[#1a1a1a]">
          <div className="p-6 border-b border-gray-200 dark:border-[#1a1a1a] flex justify-between items-center sticky top-0 bg-white dark:bg-[#111111]">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Solution</h3>
            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solution Title</label>
              <input
                type="text"
                {...form.register('title')}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none ${
                  form.formState.errors.title ? 'border-red-500' : 'border-gray-300 dark:border-[#1a1a1a]'
                }`}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                rows={4}
                {...form.register('description')}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none ${
                  form.formState.errors.description ? 'border-red-500' : 'border-gray-300 dark:border-[#1a1a1a]'
                }`}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  {...form.register('category')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maturity Level</label>
                <select
                  {...form.register('maturity_level')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="concept">Concept</option>
                  <option value="prototype">Prototype</option>
                  <option value="pilot">Pilot</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Implementation Time</label>
                <input
                  type="text"
                  {...form.register('implementation_time')}
                  placeholder="e.g., 3-6 months"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price Model</label>
                <input
                  type="text"
                  {...form.register('price_model')}
                  placeholder="e.g., Subscription"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adaptability Score (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.adaptability_score}
                onChange={(e) => setFormData({ ...formData, adaptability_score: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">{formData.adaptability_score}/10</div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Solution'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading solutions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search solutions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={maturityFilter}
            onChange={(e) => setMaturityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Stages</option>
            <option value="concept">Concept</option>
            <option value="prototype">Prototype</option>
            <option value="pilot">Pilot</option>
            <option value="production">Production</option>
          </select>

          {profile?.role === 'developer' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Solution
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSolutions.map((solution) => (
          <div key={solution.id} className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1 group-hover:text-emerald-600 transition">{solution.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{solution.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  solution.maturity_level === 'production' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                  solution.maturity_level === 'pilot' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                  solution.maturity_level === 'prototype' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {solution.maturity_level}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{solution.description}</p>

              <div className="space-y-2 mb-4">
                {solution.implementation_time && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{solution.implementation_time}</span>
                  </div>
                )}
                {solution.adaptability_score && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Zap className="w-4 h-4" />
                    <span>Adaptability: {solution.adaptability_score}/10</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                        {solution.developer?.full_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{solution.developer?.organization}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{solution.developer?.country}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSolution(solution)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition"
                    title="View details"
                  >
                    <Eye className="w-5 h-5 text-emerald-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSolutions.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No solutions found</p>
        </div>
      )}

      {showCreateModal && <CreateSolutionModal />}
      {selectedSolution && (
        <SolutionDetailModal
          solution={selectedSolution}
          onClose={() => setSelectedSolution(null)}
        />
      )}
    </div>
  );

  function SolutionDetailModal({ solution, onClose }: { solution: SmartSolution & { developer: Profile }, onClose: () => void }) {
    const [sendingConnection, setSendingConnection] = useState(false);
    const { showSuccess } = useToast();
    const handleError = useErrorHandler();

    const handleConnect = async () => {
      if (!profile || profile.id === solution.developer_id) return;

      setSendingConnection(true);
      try {
        const { error } = await connectionService.createConnection({
          initiator_id: profile.id,
          recipient_id: solution.developer_id,
          message: `I'm interested in your solution "${solution.title}"`,
          connection_type: 'inquiry',
          status: 'pending',
        });

        if (error) throw error;
        showSuccess('Connection request sent successfully!');
        onClose();
      } catch (error) {
        handleError(error, 'Failed to send connection request');
      } finally {
        setSendingConnection(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white dark:bg-[#111111] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-[#1a1a1a]">
          <div className="sticky top-0 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#1a1a1a] p-6 flex justify-between items-start z-10">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-themed-primary mb-2">{solution.title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-medium">
                  {solution.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  solution.maturity_level === 'production' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                  solution.maturity_level === 'pilot' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                  solution.maturity_level === 'prototype' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {solution.maturity_level}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-themed-primary mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Description
              </h3>
              <p className="text-themed-secondary leading-relaxed">{solution.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                <h4 className="font-semibold text-themed-primary mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Key Information
                </h4>
                <div className="space-y-2">
                  {solution.implementation_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-themed-secondary">Implementation Time:</span>
                      <span className="text-sm font-medium text-themed-primary">{solution.implementation_time}</span>
                    </div>
                  )}
                  {solution.price_model && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-themed-secondary">Price Model:</span>
                      <span className="text-sm font-medium text-themed-primary">{solution.price_model}</span>
                    </div>
                  )}
                  {solution.adaptability_score && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-themed-secondary">Adaptability:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-4 rounded-sm ${
                                i < solution.adaptability_score!
                                  ? 'bg-emerald-600'
                                  : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-themed-primary">{solution.adaptability_score}/10</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                <h4 className="font-semibold text-themed-primary mb-3 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-emerald-600" />
                  Developer
                </h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
                      {solution.developer.full_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-themed-primary">{solution.developer.full_name}</p>
                    <p className="text-sm text-themed-secondary">{solution.developer.organization}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-themed-secondary">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{solution.developer.country}, {solution.developer.region}</span>
                  </div>
                </div>
              </div>
            </div>

            {solution.technologies && solution.technologies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-themed-primary mb-3">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {solution.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-themed-primary border border-themed-primary rounded-full text-sm text-themed-secondary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {solution.target_regions && solution.target_regions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-themed-primary mb-3">Target Regions</h3>
                <div className="flex flex-wrap gap-2">
                  {solution.target_regions.map((region, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {solution.case_studies && solution.case_studies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-themed-primary mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-emerald-600" />
                  Case Studies
                </h3>
                <div className="space-y-3">
                  {solution.case_studies.map((study: any, index: number) => (
                    <div key={index} className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                      <h4 className="font-medium text-themed-primary mb-1">{study.title}</h4>
                      <p className="text-sm text-themed-secondary">{study.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile && profile.id !== solution.developer_id && (
              <div className="flex gap-3 pt-4 border-t border-themed-primary">
                <button
                  onClick={handleConnect}
                  disabled={sendingConnection}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5" />
                  {sendingConnection ? 'Sending...' : 'Connect with Developer'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

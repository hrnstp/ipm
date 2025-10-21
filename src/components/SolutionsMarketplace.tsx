import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, SmartSolution, Profile } from '../lib/supabase';
import { Search, Filter, Plus, X, Sparkles, TrendingUp, MapPin, Clock, Zap, Eye, MessageCircle, Star, Users as UsersIcon, FileText, ExternalLink } from 'lucide-react';

export default function SolutionsMarketplace() {
  const { profile } = useAuth();
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
  }, []);

  const loadSolutions = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_solutions')
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolutions(data || []);
    } catch (error) {
      console.error('Error loading solutions:', error);
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
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      category: categories[0],
      maturity_level: 'prototype' as const,
      implementation_time: '',
      price_model: '',
      adaptability_score: 5,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const { error } = await supabase.from('smart_solutions').insert([{
          ...formData,
          developer_id: profile?.id,
          technologies: [],
          target_regions: [],
        }]);

        if (error) throw error;

        await loadSolutions();
        setShowCreateModal(false);
      } catch (error) {
        console.error('Error creating solution:', error);
        alert('Failed to create solution');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
            <h3 className="text-xl font-bold text-slate-900">Create New Solution</h3>
            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Solution Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Maturity Level</label>
                <select
                  value={formData.maturity_level}
                  onChange={(e) => setFormData({ ...formData, maturity_level: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Implementation Time</label>
                <input
                  type="text"
                  value={formData.implementation_time}
                  onChange={(e) => setFormData({ ...formData, implementation_time: e.target.value })}
                  placeholder="e.g., 3-6 months"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price Model</label>
                <input
                  type="text"
                  value={formData.price_model}
                  onChange={(e) => setFormData({ ...formData, price_model: e.target.value })}
                  placeholder="e.g., Subscription"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <div className="text-center text-sm text-slate-600 mt-1">{formData.adaptability_score}/10</div>
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
    return <div className="text-center py-12 text-slate-600">Loading solutions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search solutions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={maturityFilter}
            onChange={(e) => setMaturityFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
          <div key={solution.id} className="bg-themed-secondary border border-themed-primary rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-themed-primary mb-1 group-hover:text-emerald-600 transition">{solution.title}</h3>
                  <p className="text-sm text-themed-secondary">{solution.category}</p>
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

              <p className="text-sm text-themed-secondary mb-4 line-clamp-3">{solution.description}</p>

              <div className="space-y-2 mb-4">
                {solution.implementation_time && (
                  <div className="flex items-center gap-2 text-sm text-themed-secondary">
                    <Clock className="w-4 h-4" />
                    <span>{solution.implementation_time}</span>
                  </div>
                )}
                {solution.adaptability_score && (
                  <div className="flex items-center gap-2 text-sm text-themed-secondary">
                    <Zap className="w-4 h-4" />
                    <span>Adaptability: {solution.adaptability_score}/10</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-themed-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                        {solution.developer?.full_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-themed-primary">{solution.developer?.organization}</p>
                      <p className="text-xs text-themed-tertiary">{solution.developer?.country}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSolution(solution)}
                    className="p-2 hover:bg-themed-hover rounded-lg transition"
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
          <Sparkles className="w-12 h-12 text-themed-tertiary mx-auto mb-4" />
          <p className="text-themed-secondary">No solutions found</p>
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

    const handleConnect = async () => {
      if (!profile || profile.id === solution.developer_id) return;

      setSendingConnection(true);
      try {
        const { error } = await supabase.from('connections').insert([{
          initiator_id: profile.id,
          recipient_id: solution.developer_id,
          message: `I'm interested in your solution "${solution.title}"`,
          connection_type: 'inquiry',
          status: 'pending',
        }]);

        if (error) throw error;
        alert('Connection request sent successfully!');
        onClose();
      } catch (error) {
        console.error('Error sending connection:', error);
        alert('Failed to send connection request');
      } finally {
        setSendingConnection(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-themed-secondary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
          <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-start z-10">
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

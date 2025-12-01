import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { EmptyState } from '../shared/components/ui';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Edit,
  X,
  Send,
  Clock,
  CheckCircle,
  Award,
  FolderOpen,
  CheckSquare,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../shared/hooks/useToast';

interface RFP {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  deadline: string;
  requirements: any;
  evaluation_criteria: any;
  status: string;
  published_at: string;
  created_at: string;
  municipality: any;
  bid_count?: number;
  project_id?: string;
  selected_bid_id?: string;
  project?: { title: string; status: string };
}

interface Bid {
  id: string;
  rfp_id: string;
  developer: any;
  solution_id: string;
  proposal_text: string;
  price: number;
  currency: string;
  timeline: string;
  status: string;
  submitted_at: string;
}

export default function ProcurementRFP() {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'closed'>('published');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRFP, setSelectedRFP] = useState<RFP | null>(null);

  useEffect(() => {
    loadRFPs();
    if (profile?.role === 'developer') {
      loadMyBids();
    }
  }, [filter, profile]);

  const loadRFPs = async () => {
    try {
      let query = supabase
        .from('rfp_requests')
        .select(`
          *,
          municipality:municipalities(city_name, profile_id),
          project:project_id(title, status)
        `)
        .order('created_at', { ascending: false });

      if (profile?.role === 'municipality') {
        query = query.eq('created_by', profile.id);
      } else if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rfpsWithBids = await Promise.all(
        (data || []).map(async (rfp) => {
          const { count } = await supabase
            .from('bids')
            .select('id', { count: 'exact', head: true })
            .eq('rfp_id', rfp.id);
          return { ...rfp, bid_count: count || 0 };
        })
      );

      setRfps(rfpsWithBids);
    } catch (error) {
      console.error('Error loading RFPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBids = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('developer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyBids(data || []);
    } catch (error) {
      console.error('Error loading bids:', error);
    }
  };

  const filteredRFPs = rfps.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysUntilDeadline = (deadline: string) => {
    return Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="text-center py-12 text-themed-secondary">Loading RFPs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-themed-primary flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-600" />
            Request for Proposals (RFP)
          </h2>
          <p className="text-themed-secondary mt-1">
            {profile?.role === 'municipality'
              ? 'Create and manage RFPs to solicit proposals from developers'
              : 'Browse and submit proposals for municipal smart city projects'}
          </p>
        </div>

        {profile?.role === 'municipality' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Create RFP
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-themed-tertiary w-5 h-5" />
          <input
            type="text"
            placeholder="Search RFPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-themed-hover text-themed-secondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'published'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-themed-hover text-themed-secondary'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('closed')}
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

      {profile?.role === 'developer' && myBids.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Your Active Bids</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You have {myBids.filter((b) => b.status === 'submitted').length} active proposal(s)
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRFPs.map((rfp) => {
          const daysLeft = rfp.deadline ? getDaysUntilDeadline(rfp.deadline) : null;
          const hasBid = myBids.some((b) => b.rfp_id === rfp.id);

          return (
            <div
              key={rfp.id}
              className="bg-themed-secondary border border-themed-primary rounded-xl p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedRFP(rfp)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rfp.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : rfp.status === 'closed'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}
                    >
                      {rfp.status}
                    </span>
                    {hasBid && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                        You submitted
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-themed-primary mb-1">{rfp.title}</h3>
                  <p className="text-sm text-themed-tertiary">{rfp.municipality?.city_name}</p>
                </div>
                {daysLeft !== null && daysLeft > 0 && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      daysLeft <= 7
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}
                  >
                    {daysLeft}d left
                  </span>
                )}
              </div>

              <p className="text-sm text-themed-secondary line-clamp-2 mb-4">{rfp.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-themed-secondary">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>
                    Budget: {rfp.currency} {rfp.budget_min?.toLocaleString()} -{' '}
                    {rfp.budget_max?.toLocaleString()}
                  </span>
                </div>
                {rfp.deadline && (
                  <div className="flex items-center gap-2 text-sm text-themed-secondary">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Deadline: {new Date(rfp.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-themed-secondary">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span>{rfp.bid_count} proposal(s) submitted</span>
                </div>
              </div>

              <div className="pt-4 border-t border-themed-primary flex items-center justify-between">
                <span className="inline-block px-3 py-1 bg-themed-hover text-themed-secondary rounded-full text-xs">
                  {rfp.category}
                </span>
                {rfp.project_id && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <FolderOpen className="w-4 h-4" />
                    <span>Project: {rfp.project?.title}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRFPs.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No RFPs found"
          description={
            searchTerm || filter !== 'all'
              ? "Try adjusting your search or filters to find more opportunities."
              : "No Requests for Proposals are available yet. Municipalities can create RFPs to attract solution developers."
          }
          action={
            profile?.role === 'municipality'
              ? { label: 'Create RFP', onClick: () => setShowCreateModal(true) }
              : undefined
          }
        />
      )}

      {showCreateModal && (
        <CreateRFPModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadRFPs();
            setShowCreateModal(false);
          }}
        />
      )}

      {selectedRFP && (
        <RFPDetailModal
          rfp={selectedRFP}
          onClose={() => setSelectedRFP(null)}
          onUpdate={loadRFPs}
          hasBid={myBids.some((b) => b.rfp_id === selectedRFP.id)}
        />
      )}
    </div>
  );
}

function CreateRFPModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    municipality_id: '',
    title: '',
    description: '',
    category: 'Traffic Management',
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    deadline: '',
    requirements: '',
    evaluation_criteria: '',
  });
  const [saving, setSaving] = useState(false);

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
    loadMunicipalities();
  }, []);

  const loadMunicipalities = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('municipalities')
        .select('*')
        .eq('profile_id', profile.id);

      if (error) throw error;
      setMunicipalities(data || []);
      if (data && data.length > 0) {
        setFormData((prev) => ({ ...prev, municipality_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading municipalities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const reqArray = formData.requirements.split('\n').filter((r) => r.trim());
      const criteriaArray = formData.evaluation_criteria.split('\n').filter((c) => c.trim());

      const { error } = await supabase.from('rfp_requests').insert([
        {
          municipality_id: formData.municipality_id,
          created_by: profile.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          budget_min: parseFloat(formData.budget_min) || null,
          budget_max: parseFloat(formData.budget_max) || null,
          currency: formData.currency,
          deadline: formData.deadline || null,
          requirements: { items: reqArray },
          evaluation_criteria: { items: criteriaArray },
          status: publish ? 'published' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
        },
      ]);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating RFP:', error);
      showError('Failed to create RFP');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-themed-secondary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
        <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-themed-primary">Create Request for Proposal</h3>
          <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Municipality</label>
            <select
              required
              value={formData.municipality_id}
              onChange={(e) => setFormData({ ...formData, municipality_id: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
            >
              {municipalities.map((mun) => (
                <option key={mun.id} value={mun.id}>
                  {mun.city_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">RFP Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              placeholder="e.g., Smart Traffic Light Management System"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              placeholder="Detailed description of the project requirements..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Min Budget</label>
              <input
                type="number"
                step="0.01"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Max Budget</label>
              <input
                type="number"
                step="0.01"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">
              Requirements (one per line)
            </label>
            <textarea
              rows={4}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              placeholder="List technical and functional requirements..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">
              Evaluation Criteria (one per line)
            </label>
            <textarea
              rows={4}
              value={formData.evaluation_criteria}
              onChange={(e) => setFormData({ ...formData, evaluation_criteria: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              placeholder="How proposals will be evaluated..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={saving}
              className="flex-1 px-6 py-3 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {saving ? 'Publishing...' : 'Publish RFP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RFPDetailModal({
  rfp,
  onClose,
  onUpdate,
  hasBid,
}: {
  rfp: RFP;
  onClose: () => void;
  onUpdate: () => void;
  hasBid: boolean;
}) {
  const { profile } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    if (profile?.role === 'municipality' && profile.id === rfp.municipality?.profile_id) {
      loadBids();
    } else {
      setLoading(false);
    }
  }, []);

  const loadBids = async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          developer:profiles!developer_id(full_name, organization, country)
        `)
        .eq('rfp_id', rfp.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error loading bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = rfp.deadline
    ? Math.ceil((new Date(rfp.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const canSubmitBid =
    profile?.role === 'developer' && rfp.status === 'published' && !hasBid && daysLeft && daysLeft > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-themed-secondary rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
        <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-start z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  rfp.status === 'published'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {rfp.status}
              </span>
              {daysLeft !== null && daysLeft > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium">
                  {daysLeft} days remaining
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-themed-primary mb-1">{rfp.title}</h2>
            <p className="text-themed-secondary">{rfp.municipality?.city_name}</p>
          </div>
          <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition ml-4">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
              <p className="text-sm text-themed-tertiary mb-1">Budget Range</p>
              <p className="text-lg font-bold text-themed-primary">
                {rfp.currency} {rfp.budget_min?.toLocaleString()} - {rfp.budget_max?.toLocaleString()}
              </p>
            </div>
            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
              <p className="text-sm text-themed-tertiary mb-1">Deadline</p>
              <p className="text-lg font-bold text-themed-primary">
                {rfp.deadline ? new Date(rfp.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
              <p className="text-sm text-themed-tertiary mb-1">Proposals</p>
              <p className="text-lg font-bold text-themed-primary">{rfp.bid_count}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-themed-primary mb-3">Description</h3>
            <p className="text-themed-secondary leading-relaxed whitespace-pre-wrap">{rfp.description}</p>
          </div>

          {rfp.requirements?.items && rfp.requirements.items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-themed-primary mb-3">Requirements</h3>
              <ul className="space-y-2">
                {rfp.requirements.items.map((req: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-themed-secondary">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rfp.evaluation_criteria?.items && rfp.evaluation_criteria.items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-themed-primary mb-3">Evaluation Criteria</h3>
              <ul className="space-y-2">
                {rfp.evaluation_criteria.items.map((criteria: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-themed-secondary">
                    <Award className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canSubmitBid && (
            <div className="pt-4 border-t border-themed-primary">
              <button
                onClick={() => setShowBidForm(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
              >
                <Send className="w-5 h-5" />
                Submit Proposal
              </button>
            </div>
          )}

          {profile?.role === 'municipality' && bids.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-themed-primary mb-3">Submitted Proposals</h3>
              <div className="space-y-3">
                {bids.map((bid) => (
                  <div key={bid.id} className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-themed-primary">{bid.developer.full_name}</h4>
                        <p className="text-sm text-themed-tertiary">{bid.developer.organization}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {bid.currency} {bid.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-themed-tertiary">
                          {new Date(bid.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-themed-secondary line-clamp-2">{bid.proposal_text}</p>
                    {profile?.id === rfp.municipality?.profile_id && rfp.status === 'published' && (
                      <button
                        onClick={() => handleSelectBid(bid)}
                        className="mt-3 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                      >
                        Select & Create Project
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rfp.project_id && rfp.project && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Project Created
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {rfp.project.title} - Status: {rfp.project.status}
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = '#projects'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
                >
                  View Project <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showBidForm && (
        <SubmitBidModal rfp={rfp} onClose={() => setShowBidForm(false)} onSuccess={onUpdate} />
      )}
    </div>
  );

  async function handleSelectBid(bid: any) {
    if (!profile || !confirm('Create project from this bid? This will close the RFP.')) return;

    setCreatingProject(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          solution_id: bid.solution_id,
          municipality_id: rfp.municipality_id || profile.id,
          developer_id: bid.developer_id,
          integrator_id: null,
          title: rfp.title,
          status: 'planning',
          phase: 'initiation',
          start_date: new Date().toISOString().split('T')[0],
          budget: bid.price,
          rfp_id: rfp.id,
          winning_bid_id: bid.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      await supabase
        .from('rfp_requests')
        .update({
          status: 'closed',
          selected_bid_id: bid.id,
          project_id: projectData.id,
        })
        .eq('id', rfp.id);

      await supabase
        .from('bids')
        .update({ project_id: projectData.id, status: 'accepted' })
        .eq('id', bid.id);

      await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('rfp_id', rfp.id)
        .neq('id', bid.id);

      showSuccess('Project created successfully! Redirecting to projects...');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      showError('Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  }
}

function SubmitBidModal({ rfp, onClose, onSuccess }: { rfp: RFP; onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [solutions, setSolutions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    solution_id: '',
    proposal_text: '',
    price: '',
    currency: rfp.currency,
    timeline: '',
    technical_approach: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSolutions();
  }, []);

  const loadSolutions = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('smart_solutions')
        .select('id, title')
        .eq('developer_id', profile.id);

      if (error) throw error;
      setSolutions(data || []);
    } catch (error) {
      console.error('Error loading solutions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('bids').insert([
        {
          rfp_id: rfp.id,
          developer_id: profile.id,
          solution_id: formData.solution_id || null,
          proposal_text: formData.proposal_text,
          price: parseFloat(formData.price),
          currency: formData.currency,
          timeline: formData.timeline,
          technical_approach: formData.technical_approach,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      showSuccess('Proposal submitted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting bid:', error);
      showError('Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-themed-secondary rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
        <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-themed-primary">Submit Proposal</h3>
          <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">
              Solution (Optional)
            </label>
            <select
              value={formData.solution_id}
              onChange={(e) => setFormData({ ...formData, solution_id: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
            >
              <option value="">Select a solution</option>
              {solutions.map((sol) => (
                <option key={sol.id} value={sol.id}>
                  {sol.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Proposal</label>
            <textarea
              required
              rows={6}
              value={formData.proposal_text}
              onChange={(e) => setFormData({ ...formData, proposal_text: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              placeholder="Describe your proposal..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Timeline</label>
              <input
                type="text"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                placeholder="e.g., 6-8 months"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">
              Technical Approach
            </label>
            <textarea
              rows={4}
              value={formData.technical_approach}
              onChange={(e) => setFormData({ ...formData, technical_approach: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              placeholder="Describe your technical approach..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

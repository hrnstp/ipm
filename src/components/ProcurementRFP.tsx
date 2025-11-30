import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Users,
  FolderOpen,
} from 'lucide-react';
import { CreateRFPModal } from './modals/CreateRFPModal';
import { RFPDetailModal } from './modals/RFPDetailModal';

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

      // OPTIMIZATION: Use database function to get all bid counts in ONE query instead of N+1
      if (data && data.length > 0) {
        const rfpIds = data.map(rfp => rfp.id);

        const { data: bidCounts, error: bidError } = await supabase
          .rpc('get_rfp_bid_counts', { rfp_ids: rfpIds });

        if (bidError) {
          console.error('Error loading bid counts:', bidError);
          // Fallback: set all bid counts to 0
          setRfps(data.map(rfp => ({ ...rfp, bid_count: 0 })));
        } else {
          // Create a map for quick lookup
          const bidCountMap = new Map(
            (bidCounts || []).map(bc => [bc.rfp_id, bc.bid_count])
          );

          // Merge bid counts with RFP data
          const rfpsWithBids = data.map(rfp => ({
            ...rfp,
            bid_count: bidCountMap.get(rfp.id) || 0,
          }));

          setRfps(rfpsWithBids);
        }
      } else {
        setRfps([]);
      }
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
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-themed-tertiary mx-auto mb-4" />
          <p className="text-themed-secondary">No RFPs found</p>
        </div>
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

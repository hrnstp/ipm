import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  X,
  CheckCircle,
  Award,
  Send,
  FolderOpen,
  ExternalLink,
} from 'lucide-react';
import { SubmitBidModal } from './SubmitBidModal';

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
  municipality_id?: string;
  bid_count?: number;
  project_id?: string;
  selected_bid_id?: string;
  project?: { title: string; status: string };
}

interface RFPDetailModalProps {
  rfp: RFP;
  onClose: () => void;
  onUpdate: () => void;
  hasBid: boolean;
}

export function RFPDetailModal({ rfp, onClose, onUpdate, hasBid }: RFPDetailModalProps) {
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

  const handleSelectBid = async (bid: any) => {
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

      alert('Project created successfully! Redirecting to projects...');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setCreatingProject(false);
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
                        disabled={creatingProject}
                        className="mt-3 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-50"
                      >
                        {creatingProject ? 'Creating Project...' : 'Select & Create Project'}
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
                  onClick={() => (window.location.href = '#projects')}
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
}

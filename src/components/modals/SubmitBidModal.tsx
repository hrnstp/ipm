import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Send } from 'lucide-react';

interface RFP {
  id: string;
  title: string;
  currency: string;
}

interface SubmitBidModalProps {
  rfp: RFP;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitBidModal({ rfp, onClose, onSuccess }: SubmitBidModalProps) {
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
      alert('Proposal submitted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit proposal');
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

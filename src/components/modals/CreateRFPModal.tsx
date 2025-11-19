import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Send } from 'lucide-react';

interface CreateRFPModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRFPModal({ onClose, onSuccess }: CreateRFPModalProps) {
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

    // Validate budget values
    const budgetMin = parseFloat(formData.budget_min);
    const budgetMax = parseFloat(formData.budget_max);

    if (formData.budget_min && budgetMin < 0) {
      alert('Minimum budget cannot be negative');
      return;
    }

    if (formData.budget_max && budgetMax < 0) {
      alert('Maximum budget cannot be negative');
      return;
    }

    if (formData.budget_min && formData.budget_max && budgetMin > budgetMax) {
      alert('Minimum budget cannot be greater than maximum budget');
      return;
    }

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
          budget_min: budgetMin || null,
          budget_max: budgetMax || null,
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
      alert('Failed to create RFP');
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

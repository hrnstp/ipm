import { useState, useEffect } from 'react';
import { supabase, SmartSolution, Municipality } from '../../lib/supabase';
import { X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { PROJECT_STATUSES } from '../../utils/constants';
import { INPUT_CLASSES, BUTTON_PRIMARY_CLASSES } from '../../utils/styleUtils';

interface CreateProjectModalProps {
  profileId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ profileId, onClose, onSuccess }: CreateProjectModalProps) {
  const { showSuccess, showError } = useToast();
  const [solutions, setSolutions] = useState<SmartSolution[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    solution_id: '',
    municipality_id: '',
    phase: '',
    start_date: '',
    estimated_completion: '',
    budget: '',
    adaptation_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    const [solutionsRes, municipalitiesRes] = await Promise.all([
      supabase.from('smart_solutions').select('*'),
      supabase.from('municipalities').select('*'),
    ]);

    if (solutionsRes.data) setSolutions(solutionsRes.data);
    if (municipalitiesRes.data) setMunicipalities(municipalitiesRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('projects').insert([
        {
          ...formData,
          developer_id: profileId,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          status: PROJECT_STATUSES.PLANNING,
        },
      ]);

      if (error) throw error;
      showSuccess('Project created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      showError('Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#111111] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-[#1a1a1a]">
        <div className="p-6 border-b border-gray-200 dark:border-[#1a1a1a] flex justify-between items-center sticky top-0 bg-white dark:bg-[#111111]">
          <h3 className="text-xl font-bold text-themed-primary">Create New Project</h3>
          <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Project Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={INPUT_CLASSES}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Solution</label>
              <select
                required
                value={formData.solution_id}
                onChange={(e) => setFormData({ ...formData, solution_id: e.target.value })}
                className={INPUT_CLASSES}
              >
                <option value="">Select Solution</option>
                {solutions.map((sol) => (
                  <option key={sol.id} value={sol.id}>
                    {sol.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Municipality</label>
              <select
                required
                value={formData.municipality_id}
                onChange={(e) => setFormData({ ...formData, municipality_id: e.target.value })}
                className={INPUT_CLASSES}
              >
                <option value="">Select Municipality</option>
                {municipalities.map((mun) => (
                  <option key={mun.id} value={mun.id}>
                    {mun.city_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Phase</label>
            <input
              type="text"
              value={formData.phase}
              onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
              placeholder="e.g., Planning, Implementation, Testing"
              className={INPUT_CLASSES}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Est. Completion</label>
              <input
                type="date"
                value={formData.estimated_completion}
                onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                className={INPUT_CLASSES}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Budget (USD)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="e.g., 100000"
              className={INPUT_CLASSES}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Local Adaptation Notes</label>
            <textarea
              rows={3}
              value={formData.adaptation_notes}
              onChange={(e) => setFormData({ ...formData, adaptation_notes: e.target.value })}
              placeholder="Describe any local adaptations or customizations needed..."
              className={INPUT_CLASSES}
            />
          </div>

          <button type="submit" disabled={submitting} className={`w-full ${BUTTON_PRIMARY_CLASSES}`}>
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}

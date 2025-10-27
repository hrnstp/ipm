import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DollarSign, Save, Plus, Trash2, Calculator, PieChart, TrendingUp, X } from 'lucide-react';

interface BudgetEstimate {
  id: string;
  project_id?: string;
  solution_id?: string;
  municipality_id?: string;
  total_estimate: number;
  currency: string;
  breakdown: Record<string, number>;
  implementation_cost: number;
  hardware_cost: number;
  software_cost: number;
  training_cost: number;
  maintenance_annual: number;
  notes: string;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
}

interface Solution {
  id: string;
  title: string;
}

export default function BudgetPlanner() {
  const { profile } = useAuth();
  const [estimates, setEstimates] = useState<BudgetEstimate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<BudgetEstimate | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      const [estimatesRes, projectsRes, solutionsRes] = await Promise.all([
        supabase
          .from('budget_estimates')
          .select('*')
          .eq('created_by', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('id, title')
          .or(`developer_id.eq.${profile.id},municipality_id.in.(select id from municipalities where profile_id='${profile.id}')`),
        supabase.from('smart_solutions').select('id, title'),
      ]);

      if (estimatesRes.data) setEstimates(estimatesRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (solutionsRes.data) setSolutions(solutionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEstimate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget estimate?')) return;

    try {
      const { error } = await supabase.from('budget_estimates').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting estimate:', error);
      alert('Failed to delete budget estimate');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-themed-secondary">Loading budget estimates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-themed-primary flex items-center gap-3">
            <Calculator className="w-8 h-8 text-emerald-600" />
            Budget Planner
          </h2>
          <p className="text-themed-secondary mt-1">Create and manage project budget estimates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          New Budget
        </button>
      </div>

      {estimates.length === 0 ? (
        <div className="text-center py-12 bg-themed-primary rounded-xl border border-themed-primary">
          <PieChart className="w-16 h-16 text-themed-tertiary mx-auto mb-4" />
          <p className="text-themed-secondary text-lg mb-2">No budget estimates yet</p>
          <p className="text-themed-tertiary text-sm mb-4">
            Create your first budget estimate to plan project costs
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Budget Estimate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {estimates.map((estimate) => (
            <div
              key={estimate.id}
              className="bg-themed-secondary border border-themed-primary rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-themed-primary mb-1">
                    Budget Estimate #{estimate.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-themed-tertiary">
                    {new Date(estimate.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEstimate(estimate)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                  >
                    <Calculator className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteEstimate(estimate.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-themed-secondary mb-1">Total Estimated Cost</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  {estimate.currency} {estimate.total_estimate.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-themed-secondary">Implementation</span>
                  <span className="font-medium text-themed-primary">
                    {estimate.currency} {estimate.implementation_cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-themed-secondary">Hardware</span>
                  <span className="font-medium text-themed-primary">
                    {estimate.currency} {estimate.hardware_cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-themed-secondary">Software</span>
                  <span className="font-medium text-themed-primary">
                    {estimate.currency} {estimate.software_cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-themed-secondary">Training</span>
                  <span className="font-medium text-themed-primary">
                    {estimate.currency} {estimate.training_cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-themed-primary">
                  <span className="text-themed-secondary">Annual Maintenance</span>
                  <span className="font-semibold text-blue-600">
                    {estimate.currency} {estimate.maintenance_annual.toLocaleString()}/year
                  </span>
                </div>
              </div>

              {estimate.notes && (
                <div className="mt-4 pt-4 border-t border-themed-primary">
                  <p className="text-sm text-themed-secondary italic">{estimate.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateBudgetModal
          projects={projects}
          solutions={solutions}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadData();
            setShowCreateModal(false);
          }}
        />
      )}

      {selectedEstimate && (
        <EstimateDetailModal estimate={selectedEstimate} onClose={() => setSelectedEstimate(null)} />
      )}
    </div>
  );
}

function CreateBudgetModal({
  projects,
  solutions,
  onClose,
  onSuccess,
}: {
  projects: Project[];
  solutions: Solution[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    project_id: '',
    solution_id: '',
    currency: 'USD',
    implementation_cost: '',
    hardware_cost: '',
    software_cost: '',
    training_cost: '',
    maintenance_annual: '',
    notes: '',
  });
  const [customBreakdown, setCustomBreakdown] = useState<{ label: string; amount: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const calculateTotal = () => {
    const costs = [
      parseFloat(formData.implementation_cost) || 0,
      parseFloat(formData.hardware_cost) || 0,
      parseFloat(formData.software_cost) || 0,
      parseFloat(formData.training_cost) || 0,
    ];

    const customTotal = customBreakdown.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return costs.reduce((a, b) => a + b, 0) + customTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const breakdown: Record<string, number> = {};
      customBreakdown.forEach((item) => {
        if (item.label && item.amount) {
          breakdown[item.label] = parseFloat(item.amount);
        }
      });

      const { error } = await supabase.from('budget_estimates').insert([
        {
          project_id: formData.project_id || null,
          solution_id: formData.solution_id || null,
          created_by: profile.id,
          total_estimate: calculateTotal(),
          currency: formData.currency,
          breakdown,
          implementation_cost: parseFloat(formData.implementation_cost) || 0,
          hardware_cost: parseFloat(formData.hardware_cost) || 0,
          software_cost: parseFloat(formData.software_cost) || 0,
          training_cost: parseFloat(formData.training_cost) || 0,
          maintenance_annual: parseFloat(formData.maintenance_annual) || 0,
          notes: formData.notes,
        },
      ]);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating budget estimate:', error);
      alert('Failed to create budget estimate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-themed-secondary rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
        <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-themed-primary">Create Budget Estimate</h3>
          <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">
                Project (Optional)
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">
                Solution (Optional)
              </label>
              <select
                value={formData.solution_id}
                onChange={(e) => setFormData({ ...formData, solution_id: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              >
                <option value="">Select solution</option>
                {solutions.map((solution) => (
                  <option key={solution.id} value={solution.id}>
                    {solution.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="ZAR">ZAR (R)</option>
              <option value="INR">INR (₹)</option>
              <option value="BRL">BRL (R$)</option>
            </select>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-themed-primary">Cost Breakdown</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Implementation Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.implementation_cost}
                  onChange={(e) => setFormData({ ...formData, implementation_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">Hardware Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hardware_cost}
                  onChange={(e) => setFormData({ ...formData, hardware_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">Software Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.software_cost}
                  onChange={(e) => setFormData({ ...formData, software_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">Training Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.training_cost}
                  onChange={(e) => setFormData({ ...formData, training_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">
                Annual Maintenance Cost
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.maintenance_annual}
                onChange={(e) => setFormData({ ...formData, maintenance_annual: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-themed-secondary">
                Custom Cost Items (Optional)
              </label>
              <button
                type="button"
                onClick={() => setCustomBreakdown([...customBreakdown, { label: '', amount: '' }])}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {customBreakdown.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const updated = [...customBreakdown];
                      updated[idx].label = e.target.value;
                      setCustomBreakdown(updated);
                    }}
                    placeholder="Item name"
                    className="flex-1 px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => {
                      const updated = [...customBreakdown];
                      updated[idx].amount = e.target.value;
                      setCustomBreakdown(updated);
                    }}
                    placeholder="Amount"
                    className="w-32 px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomBreakdown(customBreakdown.filter((_, i) => i !== idx))}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-themed-primary">Total Estimate</span>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {formData.currency} {calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-themed-secondary mb-1">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or assumptions..."
              className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Budget Estimate'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EstimateDetailModal({
  estimate,
  onClose,
}: {
  estimate: BudgetEstimate;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-themed-secondary rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
        <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-themed-primary">Budget Estimate Details</h3>
          <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-6 text-center">
            <p className="text-sm text-themed-secondary mb-2">Total Estimated Cost</p>
            <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">
              {estimate.currency} {estimate.total_estimate.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-themed-primary border border-themed-primary rounded-lg p-4">
              <p className="text-sm text-themed-tertiary mb-1">Implementation</p>
              <p className="text-xl font-bold text-themed-primary">
                {estimate.currency} {estimate.implementation_cost.toLocaleString()}
              </p>
            </div>
            <div className="bg-themed-primary border border-themed-primary rounded-lg p-4">
              <p className="text-sm text-themed-tertiary mb-1">Hardware</p>
              <p className="text-xl font-bold text-themed-primary">
                {estimate.currency} {estimate.hardware_cost.toLocaleString()}
              </p>
            </div>
            <div className="bg-themed-primary border border-themed-primary rounded-lg p-4">
              <p className="text-sm text-themed-tertiary mb-1">Software</p>
              <p className="text-xl font-bold text-themed-primary">
                {estimate.currency} {estimate.software_cost.toLocaleString()}
              </p>
            </div>
            <div className="bg-themed-primary border border-themed-primary rounded-lg p-4">
              <p className="text-sm text-themed-tertiary mb-1">Training</p>
              <p className="text-xl font-bold text-themed-primary">
                {estimate.currency} {estimate.training_cost.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300 mb-1">Annual Maintenance Cost</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {estimate.currency} {estimate.maintenance_annual.toLocaleString()}/year
            </p>
          </div>

          {estimate.breakdown && Object.keys(estimate.breakdown).length > 0 && (
            <div>
              <h4 className="font-semibold text-themed-primary mb-3">Additional Cost Items</h4>
              <div className="space-y-2">
                {Object.entries(estimate.breakdown).map(([label, amount]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center p-3 bg-themed-primary border border-themed-primary rounded-lg"
                  >
                    <span className="text-themed-secondary">{label}</span>
                    <span className="font-semibold text-themed-primary">
                      {estimate.currency} {amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {estimate.notes && (
            <div className="bg-themed-primary border border-themed-primary rounded-lg p-4">
              <h4 className="font-semibold text-themed-primary mb-2">Notes</h4>
              <p className="text-themed-secondary">{estimate.notes}</p>
            </div>
          )}

          <p className="text-sm text-themed-tertiary text-center">
            Created on {new Date(estimate.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

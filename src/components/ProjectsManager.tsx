import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Project, SmartSolution, Municipality, Integrator } from '../lib/supabase';
import { FolderOpen, Plus, X, Clock, TrendingUp, MapPin, DollarSign, BookOpen, Lightbulb, GraduationCap, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ProjectsManager() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
  }, [profile]);

  const loadProjects = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          solution:smart_solutions(*),
          municipality:municipalities(*),
          integrator:integrators(*),
          developer:profiles!developer_id(*)
        `)
        .order('created_at', { ascending: false });

      if (profile.role === 'developer') {
        query = query.eq('developer_id', profile.id);
      } else if (profile.role === 'municipality') {
        const { data: munData } = await supabase
          .from('municipalities')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (munData) {
          query = query.eq('municipality_id', munData.id);
        }
      } else if (profile.role === 'integrator') {
        const { data: intData } = await supabase
          .from('integrators')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (intData) {
          query = query.eq('integrator_id', intData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const CreateProjectModal = () => {
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
        const { error } = await supabase.from('projects').insert([{
          ...formData,
          developer_id: profile?.id,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          status: 'planning',
        }]);

        if (error) throw error;
        await loadProjects();
        setShowCreateModal(false);
      } catch (error) {
        console.error('Error creating project:', error);
        alert('Failed to create project');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
            <h3 className="text-xl font-bold text-slate-900">Create New Project</h3>
            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Solution</label>
                <select
                  required
                  value={formData.solution_id}
                  onChange={(e) => setFormData({ ...formData, solution_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">Select Solution</option>
                  {solutions.map((sol) => (
                    <option key={sol.id} value={sol.id}>{sol.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Municipality</label>
                <select
                  required
                  value={formData.municipality_id}
                  onChange={(e) => setFormData({ ...formData, municipality_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">Select Municipality</option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.id}>{mun.city_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phase</label>
              <input
                type="text"
                value={formData.phase}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                placeholder="e.g., Planning, Implementation, Testing"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Est. Completion</label>
                <input
                  type="date"
                  value={formData.estimated_completion}
                  onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget (USD)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g., 100000"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Local Adaptation Notes</label>
              <textarea
                rows={3}
                value={formData.adaptation_notes}
                onChange={(e) => setFormData({ ...formData, adaptation_notes: e.target.value })}
                placeholder="Describe any local adaptations or customizations needed..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const filteredProjects = statusFilter === 'all'
    ? projects
    : projects.filter(p => p.status === statusFilter);

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'all' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setStatusFilter('planning')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'planning' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Planning ({projects.filter(p => p.status === 'planning').length})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            In Progress ({projects.filter(p => p.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Completed ({projects.filter(p => p.status === 'completed').length})
          </button>
        </div>

        {(profile?.role === 'developer' || profile?.role === 'municipality') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-themed-secondary border border-themed-primary rounded-xl p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-themed-primary mb-1">{project.title}</h3>
                <p className="text-themed-secondary">{project.solution?.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                  project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  project.status === 'on_hold' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => setSelectedProject(project)}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span>{project.municipality?.city_name}</span>
              </div>
              {project.start_date && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(project.start_date).toLocaleDateString()}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign className="w-4 h-4" />
                  <span>${project.budget.toLocaleString()}</span>
                </div>
              )}
            </div>

            {project.phase && (
              <div className="mb-4">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                  Phase: {project.phase}
                </span>
              </div>
            )}

            {project.adaptation_notes && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-slate-700 mb-1">Local Adaptations:</p>
                <p className="text-sm text-slate-600">{project.adaptation_notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>Developer: {project.developer?.organization}</span>
                {project.integrator && (
                  <>
                    <span>•</span>
                    <span>Integrator: {project.integrator.company_name}</span>
                  </>
                )}
              </div>
              {project.estimated_completion && (
                <div className="text-sm text-slate-500">
                  Est. completion: {new Date(project.estimated_completion).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-themed-tertiary mx-auto mb-4" />
          <p className="text-themed-secondary">No projects found</p>
        </div>
      )}

      {showCreateModal && <CreateProjectModal />}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={loadProjects}
        />
      )}
    </div>
  );

  function ProjectDetailsModal({ project, onClose, onUpdate }: { project: any, onClose: () => void, onUpdate: () => void }) {
    const [transfers, setTransfers] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [showAddTransfer, setShowAddTransfer] = useState(false);
    const [showAddMilestone, setShowAddMilestone] = useState(false);
    const [transferForm, setTransferForm] = useState({
      transfer_type: 'knowledge' as const,
      description: '',
      challenges: '',
      solutions: '',
    });
    const [milestoneForm, setMilestoneForm] = useState({
      title: '',
      description: '',
      amount: '',
      currency: 'USD',
      due_date: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadTransfers();
      loadMilestones();
    }, []);

    const loadTransfers = async () => {
      try {
        const { data, error } = await supabase
          .from('technology_transfers')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransfers(data || []);
      } catch (error) {
        console.error('Error loading transfers:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadMilestones = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setMilestones(data || []);
      } catch (error) {
        console.error('Error loading milestones:', error);
      }
    };

    const handleAddTransfer = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const { error } = await supabase.from('technology_transfers').insert([{
          project_id: project.id,
          transfer_type: transferForm.transfer_type,
          description: transferForm.description,
          challenges_faced: transferForm.challenges.split('\n').filter(c => c.trim()),
          solutions_applied: transferForm.solutions.split('\n').filter(s => s.trim()),
        }]);

        if (error) throw error;

        setShowAddTransfer(false);
        setTransferForm({
          transfer_type: 'knowledge',
          description: '',
          challenges: '',
          solutions: '',
        });
        loadTransfers();
      } catch (error) {
        console.error('Error adding transfer:', error);
        alert('Failed to add technology transfer');
      }
    };

    const handleAddMilestone = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const { error } = await supabase.from('payment_milestones').insert([{
          project_id: project.id,
          title: milestoneForm.title,
          description: milestoneForm.description,
          amount: parseFloat(milestoneForm.amount),
          currency: milestoneForm.currency,
          due_date: milestoneForm.due_date || null,
          status: 'pending',
          order_index: milestones.length,
        }]);

        if (error) throw error;

        setShowAddMilestone(false);
        setMilestoneForm({
          title: '',
          description: '',
          amount: '',
          currency: 'USD',
          due_date: '',
        });
        loadMilestones();
      } catch (error) {
        console.error('Error adding milestone:', error);
        alert('Failed to add payment milestone');
      }
    };

    const updateMilestoneStatus = async (milestoneId: string, status: string) => {
      try {
        const updates: any = { status, updated_at: new Date().toISOString() };
        if (status === 'paid') {
          updates.paid_date = new Date().toISOString();
        }

        const { error } = await supabase
          .from('payment_milestones')
          .update(updates)
          .eq('id', milestoneId);

        if (error) throw error;
        loadMilestones();
      } catch (error) {
        console.error('Error updating milestone:', error);
        alert('Failed to update milestone status');
      }
    };

    const transferTypeIcons = {
      knowledge: BookOpen,
      training: GraduationCap,
      documentation: FileText,
      technical_support: Lightbulb,
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-themed-secondary rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
          <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-start z-10">
            <div>
              <h2 className="text-2xl font-bold text-themed-primary mb-2">{project.title}</h2>
              <p className="text-themed-secondary">{project.solution?.title}</p>
            </div>
            <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                <p className="text-sm text-themed-secondary mb-1">Status</p>
                <p className="text-lg font-semibold text-themed-primary capitalize">{project.status.replace('_', ' ')}</p>
              </div>
              <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                <p className="text-sm text-themed-secondary mb-1">Budget</p>
                <p className="text-lg font-semibold text-themed-primary">
                  {project.budget ? `$${project.budget.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                <p className="text-sm text-themed-secondary mb-1">Phase</p>
                <p className="text-lg font-semibold text-themed-primary">{project.phase || 'N/A'}</p>
              </div>
            </div>

            {project.adaptation_notes && (
              <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                <h3 className="font-semibold text-themed-primary mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Local Adaptations
                </h3>
                <p className="text-themed-secondary">{project.adaptation_notes}</p>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-themed-primary flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  Payment Milestones
                </h3>
                <button
                  onClick={() => setShowAddMilestone(!showAddMilestone)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Milestone
                </button>
              </div>

              {showAddMilestone && (
                <form onSubmit={handleAddMilestone} className="bg-themed-primary rounded-lg p-4 border border-themed-primary mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Milestone Title</label>
                      <input
                        type="text"
                        required
                        value={milestoneForm.title}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-themed-primary text-themed-primary"
                        placeholder="e.g., First Installment"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={milestoneForm.amount}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-themed-primary text-themed-primary"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Currency</label>
                      <select
                        value={milestoneForm.currency}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, currency: e.target.value })}
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-themed-primary text-themed-primary"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="ZAR">ZAR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Due Date</label>
                      <input
                        type="date"
                        value={milestoneForm.due_date}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-themed-primary text-themed-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={milestoneForm.description}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-themed-primary text-themed-primary"
                        placeholder="Optional description..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Add Milestone
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddMilestone(false)}
                      className="px-6 py-2 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {milestones.length === 0 ? (
                <div className="text-center py-8 bg-themed-primary rounded-lg border border-themed-primary">
                  <DollarSign className="w-12 h-12 text-themed-tertiary mx-auto mb-2" />
                  <p className="text-themed-secondary">No payment milestones added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone, idx) => (
                    <div key={milestone.id} className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-themed-primary">{milestone.title}</h4>
                            {milestone.description && (
                              <p className="text-sm text-themed-secondary mt-1">{milestone.description}</p>
                            )}
                            {milestone.due_date && (
                              <p className="text-xs text-themed-tertiary mt-1">
                                Due: {new Date(milestone.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-themed-primary">
                            {milestone.currency} {milestone.amount.toLocaleString()}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                              milestone.status === 'paid'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : milestone.status === 'overdue'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}
                          >
                            {milestone.status}
                          </span>
                        </div>
                      </div>

                      {milestone.status === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-themed-primary">
                          <button
                            onClick={() => updateMilestoneStatus(milestone.id, 'paid')}
                            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                          >
                            Mark as Paid
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-themed-primary flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Technology Transfer Tracking
                </h3>
                <button
                  onClick={() => setShowAddTransfer(!showAddTransfer)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Transfer
                </button>
              </div>

              {showAddTransfer && (
                <form onSubmit={handleAddTransfer} className="bg-themed-primary rounded-lg p-4 border border-themed-primary mb-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Transfer Type</label>
                      <select
                        value={transferForm.transfer_type}
                        onChange={(e) => setTransferForm({ ...transferForm, transfer_type: e.target.value as any })}
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                      >
                        <option value="knowledge">Knowledge Transfer</option>
                        <option value="training">Training</option>
                        <option value="documentation">Documentation</option>
                        <option value="technical_support">Technical Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Description</label>
                      <textarea
                        required
                        rows={3}
                        value={transferForm.description}
                        onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Challenges (one per line)</label>
                      <textarea
                        rows={3}
                        value={transferForm.challenges}
                        onChange={(e) => setTransferForm({ ...transferForm, challenges: e.target.value })}
                        placeholder="List challenges encountered..."
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-themed-secondary mb-1">Solutions Applied (one per line)</label>
                      <textarea
                        rows={3}
                        value={transferForm.solutions}
                        onChange={(e) => setTransferForm({ ...transferForm, solutions: e.target.value })}
                        placeholder="List solutions implemented..."
                        className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
                      >
                        Add Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddTransfer(false)}
                        className="px-6 py-2 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="text-center py-8 text-themed-secondary">Loading transfers...</div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-8 bg-themed-primary rounded-lg border border-themed-primary">
                  <TrendingUp className="w-12 h-12 text-themed-tertiary mx-auto mb-2" />
                  <p className="text-themed-secondary">No technology transfers recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transfers.map((transfer) => {
                    const Icon = transferTypeIcons[transfer.transfer_type as keyof typeof transferTypeIcons];
                    return (
                      <div key={transfer.id} className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-themed-primary capitalize">
                                {transfer.transfer_type.replace('_', ' ')}
                              </h4>
                              <span className="text-xs text-themed-tertiary">
                                {new Date(transfer.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-themed-secondary">{transfer.description}</p>
                          </div>
                        </div>

                        {transfer.challenges_faced && transfer.challenges_faced.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-themed-primary mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              Challenges
                            </h5>
                            <ul className="space-y-1">
                              {transfer.challenges_faced.map((challenge: string, idx: number) => (
                                <li key={idx} className="text-sm text-themed-secondary pl-4 border-l-2 border-yellow-600">
                                  {challenge}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {transfer.solutions_applied && transfer.solutions_applied.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-themed-primary mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Solutions Applied
                            </h5>
                            <ul className="space-y-1">
                              {transfer.solutions_applied.map((solution: string, idx: number) => (
                                <li key={idx} className="text-sm text-themed-secondary pl-4 border-l-2 border-green-600">
                                  {solution}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

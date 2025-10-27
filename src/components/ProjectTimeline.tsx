import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, CheckCircle2, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  target_date: string;
  actual_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completion_percentage: number;
  deliverables: any[];
  created_at: string;
}

export default function ProjectTimeline() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    status: 'pending' as Milestone['status'],
    completion_percentage: 0,
    deliverables: '',
  });

  useEffect(() => {
    loadProjects();
  }, [profile]);

  useEffect(() => {
    if (selectedProject) {
      loadMilestones();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    if (!profile) return;

    try {
      const query = supabase.from('projects').select('id, name');

      if (profile.role === 'municipality') {
        query.eq('municipality_id', profile.id);
      } else if (profile.role === 'developer') {
        query.eq('developer_id', profile.id);
      } else if (profile.role === 'integrator') {
        query.eq('integrator_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProjects(data || []);
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async () => {
    if (!selectedProject) return;

    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', selectedProject)
        .order('target_date');

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error loading milestones:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const deliverables = formData.deliverables
        .split('\n')
        .filter(d => d.trim())
        .map(d => ({ name: d.trim() }));

      if (editingMilestone) {
        const { error } = await supabase
          .from('project_milestones')
          .update({
            title: formData.title,
            description: formData.description,
            target_date: formData.target_date,
            status: formData.status,
            completion_percentage: formData.completion_percentage,
            deliverables,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMilestone.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('project_milestones').insert({
          project_id: selectedProject,
          title: formData.title,
          description: formData.description,
          target_date: formData.target_date,
          status: formData.status,
          completion_percentage: formData.completion_percentage,
          deliverables,
        });

        if (error) throw error;
      }

      setFormData({
        title: '',
        description: '',
        target_date: '',
        status: 'pending',
        completion_percentage: 0,
        deliverables: '',
      });
      setEditingMilestone(null);
      setShowForm(false);
      loadMilestones();
    } catch (error) {
      console.error('Error saving milestone:', error);
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      target_date: milestone.target_date,
      status: milestone.status,
      completion_percentage: milestone.completion_percentage,
      deliverables: (milestone.deliverables || []).map((d: any) => d.name).join('\n'),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const { error } = await supabase.from('project_milestones').delete().eq('id', id);
      if (error) throw error;
      loadMilestones();
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'delayed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Calendar className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading timeline...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Project Timeline</h2>
            <p className="text-sm text-slate-600">Track milestones and deliverables</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingMilestone(null);
            setFormData({
              title: '',
              description: '',
              target_date: '',
              status: 'pending',
              completion_percentage: 0,
              deliverables: '',
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Project
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">Choose a project...</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Milestone name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Milestone details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Milestone['status'] })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Completion: {formData.completion_percentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.completion_percentage}
                  onChange={(e) => setFormData({ ...formData, completion_percentage: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deliverables (one per line)
              </label>
              <textarea
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter deliverables..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingMilestone ? 'Update' : 'Create'} Milestone
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMilestone(null);
                }}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedProject && milestones.length > 0 && (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">{getStatusIcon(milestone.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {milestone.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>
                      {milestone.description && (
                        <p className="text-slate-600 mb-3">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Target: {new Date(milestone.target_date).toLocaleDateString()}
                        </div>
                        {milestone.actual_date && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed: {new Date(milestone.actual_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(milestone)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(milestone.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>Progress</span>
                    <span className="font-medium">{milestone.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${milestone.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {milestone.deliverables && milestone.deliverables.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Deliverables:</h4>
                    <ul className="space-y-1">
                      {milestone.deliverables.map((deliverable: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {deliverable.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {index < milestones.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-0.5 h-8 bg-slate-200" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedProject && milestones.length === 0 && !showForm && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No milestones yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create First Milestone
          </button>
        </div>
      )}
    </div>
  );
}

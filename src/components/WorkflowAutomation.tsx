import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Workflow, Play, Plus, Edit2, Trash2, Copy, CheckCircle2, Clock, Activity } from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'software' | 'infrastructure' | 'service';
  phases: any[];
  default_tasks: any[];
  default_milestones: any[];
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  changes: any;
  metadata: any;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export default function WorkflowAutomation() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'software' as WorkflowTemplate['category'],
    phases: '',
    default_tasks: '',
    default_milestones: '',
    is_public: true,
  });

  useEffect(() => {
    loadTemplates();
    loadProjects();
  }, [profile]);

  useEffect(() => {
    if (selectedProject) {
      loadActivityLog();
    }
  }, [selectedProject]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const loadActivityLog = async () => {
    if (!selectedProject) return;

    try {
      const { data, error } = await supabase
        .from('project_activity_log')
        .select(`
          *,
          user:user_id(full_name, email)
        `)
        .eq('project_id', selectedProject)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLog(data || []);
    } catch (error) {
      console.error('Error loading activity log:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const phases = formData.phases.split('\n').filter(p => p.trim()).map(p => {
        const [name, duration] = p.split(':').map(s => s.trim());
        return { name, duration_days: parseInt(duration) || 0 };
      });

      const defaultTasks = formData.default_tasks.split('\n').filter(t => t.trim()).map(t => {
        const parts = t.split('|').map(s => s.trim());
        return {
          title: parts[0],
          phase: parts[1] || '',
          priority: parts[2] || 'medium',
          estimated_hours: parseInt(parts[3]) || 0,
        };
      });

      const defaultMilestones = formData.default_milestones.split('\n').filter(m => m.trim()).map(m => {
        const [title, phase] = m.split('|').map(s => s.trim());
        return { title, phase };
      });

      if (editingTemplate) {
        const { error } = await supabase
          .from('workflow_templates')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            phases,
            default_tasks: defaultTasks,
            default_milestones: defaultMilestones,
            is_public: formData.is_public,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('workflow_templates').insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          phases,
          default_tasks: defaultTasks,
          default_milestones: defaultMilestones,
          is_public: formData.is_public,
          created_by: profile.id,
        });

        if (error) throw error;
      }

      setFormData({
        name: '',
        description: '',
        category: 'software',
        phases: '',
        default_tasks: '',
        default_milestones: '',
        is_public: true,
      });
      setEditingTemplate(null);
      setShowForm(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleApplyTemplate = async (template: WorkflowTemplate, projectId: string) => {
    if (!profile) return;
    if (!confirm(`Apply "${template.name}" workflow to this project?`)) return;

    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      const startDate = new Date();

      for (const milestone of template.default_milestones) {
        const phase = template.phases.find(p => p.name === milestone.phase);
        const targetDate = new Date(startDate);
        if (phase) {
          targetDate.setDate(targetDate.getDate() + phase.duration_days);
        }

        await supabase.from('project_milestones').insert({
          project_id: projectId,
          title: milestone.title,
          description: `Milestone from ${template.name} workflow`,
          target_date: targetDate.toISOString().split('T')[0],
          status: 'pending',
        });
      }

      for (const task of template.default_tasks) {
        await supabase.from('project_tasks').insert({
          project_id: projectId,
          title: task.title,
          description: `Task from ${template.name} workflow - Phase: ${task.phase}`,
          status: 'todo',
          priority: task.priority,
          created_by: profile.id,
          estimated_hours: task.estimated_hours,
          tags: [task.phase, template.category],
        });
      }

      await supabase.from('project_activity_log').insert({
        project_id: projectId,
        user_id: profile.id,
        action_type: 'workflow_applied',
        entity_type: 'workflow_template',
        entity_id: template.id,
        metadata: {
          template_name: template.name,
          project_name: projectData?.name,
          tasks_created: template.default_tasks.length,
          milestones_created: template.default_milestones.length,
        },
      });

      alert(`Workflow "${template.name}" applied successfully! Created ${template.default_tasks.length} tasks and ${template.default_milestones.length} milestones.`);
      loadActivityLog();
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply workflow template');
    }
  };

  const handleEdit = (template: WorkflowTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      phases: template.phases.map(p => `${p.name}: ${p.duration_days}`).join('\n'),
      default_tasks: template.default_tasks.map(t =>
        `${t.title} | ${t.phase} | ${t.priority} | ${t.estimated_hours}`
      ).join('\n'),
      default_milestones: template.default_milestones.map(m => `${m.title} | ${m.phase}`).join('\n'),
      is_public: template.is_public,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase.from('workflow_templates').delete().eq('id', id);
      if (error) throw error;
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const getCategoryColor = (category: WorkflowTemplate['category']) => {
    switch (category) {
      case 'software':
        return 'bg-blue-100 text-blue-800';
      case 'infrastructure':
        return 'bg-green-100 text-green-800';
      case 'service':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'workflow_applied':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'status_changed':
        return <Activity className="w-4 h-4 text-orange-600" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading workflows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Workflow className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Workflow Automation</h2>
            <p className="text-sm text-slate-600">Template-based project workflows and activity tracking</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <Activity className="w-4 h-4" />
            Activity Log
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingTemplate(null);
              setFormData({
                name: '',
                description: '',
                category: 'software',
                phases: '',
                default_tasks: '',
                default_milestones: '',
                is_public: true,
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {showActivity && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Activity Log</h3>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              <option value="">Select project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activityLog.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="mt-1">{getActionIcon(log.action_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900">{log.user?.full_name}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {log.action_type.replace('_', ' ')} {log.entity_type}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-slate-500">
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <div key={key}>
                            {key}: {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {activityLog.length === 0 && (
                <p className="text-center text-slate-500 py-6">No activity yet</p>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingTemplate ? 'Edit Template' : 'Create Workflow Template'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Smart Parking System"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as WorkflowTemplate['category'] })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="software">Software</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Template description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phases (one per line: "Phase Name: duration_days")
              </label>
              <textarea
                value={formData.phases}
                onChange={(e) => setFormData({ ...formData, phases: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                placeholder="Discovery: 14&#10;Planning: 21&#10;Development: 60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Tasks (one per line: "Title | Phase | Priority | Hours")
              </label>
              <textarea
                value={formData.default_tasks}
                onChange={(e) => setFormData({ ...formData, default_tasks: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                placeholder="Requirements Gathering | Discovery | high | 40&#10;Technical Design | Planning | high | 60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Milestones (one per line: "Title | Phase")
              </label>
              <textarea
                value={formData.default_milestones}
                onChange={(e) => setFormData({ ...formData, default_milestones: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                placeholder="Requirements Approved | Discovery&#10;Design Complete | Planning"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is_public" className="text-sm font-medium text-slate-700">
                Make this template public
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                }}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
              </div>
              {template.created_by === profile?.id && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {template.description && (
              <p className="text-sm text-slate-600 mb-4">{template.description}</p>
            )}

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Phases:</span>
                <span className="font-medium text-slate-900">{template.phases.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tasks:</span>
                <span className="font-medium text-slate-900">{template.default_tasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Milestones:</span>
                <span className="font-medium text-slate-900">{template.default_milestones.length}</span>
              </div>
            </div>

            <div className="space-y-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleApplyTemplate(template, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
              >
                <option value="">Apply to Project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !showForm && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Workflow className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No workflow templates yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create First Template
          </button>
        </div>
      )}
    </div>
  );
}

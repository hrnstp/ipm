import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckSquare, Plus, Edit2, Trash2, User, Calendar, Clock, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  created_at: string;
  assignee?: Profile;
  creator?: Profile;
}

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}

export default function TaskManager() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    assigned_to: '',
    due_date: '',
    estimated_hours: '',
    tags: '',
  });

  useEffect(() => {
    loadProjects();
  }, [profile]);

  useEffect(() => {
    if (selectedProject) {
      loadTasks();
      loadTeamMembers();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedTask) {
      loadComments();
    }
  }, [selectedTask]);

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

  const loadTasks = async () => {
    if (!selectedProject) return;

    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          *,
          assignee:assigned_to(id, full_name, email),
          creator:created_by(id, full_name, email)
        `)
        .eq('project_id', selectedProject)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadTeamMembers = async () => {
    if (!selectedProject) return;

    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('municipality_id, developer_id, integrator_id')
        .eq('id', selectedProject)
        .single();

      if (projectError) throw projectError;

      const memberIds = [
        projectData.municipality_id,
        projectData.developer_id,
        projectData.integrator_id,
      ].filter(Boolean);

      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', memberIds);

      if (membersError) throw membersError;
      setTeamMembers(members || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadComments = async () => {
    if (!selectedTask) return;

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user:user_id(id, full_name, email)
        `)
        .eq('task_id', selectedTask.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !profile) return;

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      if (editingTask) {
        const { error } = await supabase
          .from('project_tasks')
          .update({
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            assigned_to: formData.assigned_to || null,
            due_date: formData.due_date || null,
            estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
            tags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTask.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('project_tasks').insert({
          project_id: selectedProject,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
          created_by: profile.id,
          due_date: formData.due_date || null,
          estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
          tags,
        });

        if (error) throw error;
      }

      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        estimated_hours: '',
        tags: '',
      });
      setEditingTask(null);
      setShowForm(false);
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !profile || !newComment.trim()) return;

    try {
      const { error } = await supabase.from('task_comments').insert({
        task_id: selectedTask.id,
        user_id: profile.id,
        content: newComment,
      });

      if (error) throw error;

      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours?.toString() || '',
      tags: task.tags?.join(', ') || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase.from('project_tasks').delete().eq('id', id);
      if (error) throw error;
      loadTasks();
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const groupedTasks = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    blocked: filteredTasks.filter(t => t.status === 'blocked'),
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CheckSquare className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Task Management</h2>
            <p className="text-sm text-slate-600">Organize and track project tasks</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingTask(null);
            setFormData({
              title: '',
              description: '',
              status: 'todo',
              priority: 'medium',
              assigned_to: '',
              due_date: '',
              estimated_hours: '',
              tags: '',
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Priority
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter task title"
              />
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
                placeholder="Task details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign To
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="frontend, api, bug"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingTask ? 'Update' : 'Create'} Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedProject && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([status, statusTasks]) => (
              <div key={status}>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  {status.replace('_', ' ')} ({statusTasks.length})
                </h3>
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition ${
                        selectedTask?.id === task.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 flex-1">{task.title}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(task);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignee.full_name}
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimated_hours}h
                          </div>
                        )}
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                      <p className="text-sm text-slate-400">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            {selectedTask ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{selectedTask.title}</h3>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>

                {selectedTask.description && (
                  <p className="text-slate-600 mb-4">{selectedTask.description}</p>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status:</span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Priority:</span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  {selectedTask.assignee && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Assigned to:</span>
                      <span className="text-sm font-medium text-slate-900">{selectedTask.assignee.full_name}</span>
                    </div>
                  )}
                  {selectedTask.due_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Due date:</span>
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(selectedTask.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {selectedTask.estimated_hours && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Estimated:</span>
                      <span className="text-sm font-medium text-slate-900">{selectedTask.estimated_hours}h</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments ({comments.length})
                  </h4>

                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-900">
                            {comment.user?.full_name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Post
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Select a task to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProject && filteredTasks.length === 0 && !showForm && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No tasks yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create First Task
          </button>
        </div>
      )}
    </div>
  );
}

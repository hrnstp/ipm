import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, Upload, Download, Trash2, Eye, Lock, Unlock, FolderOpen } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Document {
  id: string;
  project_id: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: 'contract' | 'requirement' | 'design' | 'report' | 'other';
  version: string;
  uploaded_by: string;
  is_public: boolean;
  created_at: string;
  uploader?: {
    full_name: string;
    email: string;
  };
}

export default function DocumentManager() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file_url: '',
    file_type: '',
    file_size: 0,
    category: 'other' as Document['category'],
    version: '1.0',
    is_public: false,
  });

  useEffect(() => {
    loadProjects();
  }, [profile]);

  useEffect(() => {
    if (selectedProject) {
      loadDocuments();
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

  const loadDocuments = async () => {
    if (!selectedProject) return;

    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select(`
          *,
          uploader:uploaded_by(full_name, email)
        `)
        .eq('project_id', selectedProject)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !profile) return;

    try {
      const { error } = await supabase.from('project_documents').insert({
        project_id: selectedProject,
        name: formData.name,
        description: formData.description,
        file_url: formData.file_url,
        file_type: formData.file_type,
        file_size: formData.file_size,
        category: formData.category,
        version: formData.version,
        uploaded_by: profile.id,
        is_public: formData.is_public,
      });

      if (error) throw error;

      setFormData({
        name: '',
        description: '',
        file_url: '',
        file_type: '',
        file_size: 0,
        category: 'other',
        version: '1.0',
        is_public: false,
      });
      setShowForm(false);
      loadDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase.from('project_documents').delete().eq('id', id);
      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const togglePublic = async (doc: Document) => {
    try {
      const { error } = await supabase
        .from('project_documents')
        .update({ is_public: !doc.is_public })
        .eq('id', doc.id);

      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error('Error updating document visibility:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryColor = (category: Document['category']) => {
    switch (category) {
      case 'contract':
        return 'bg-blue-100 text-blue-800';
      case 'requirement':
        return 'bg-purple-100 text-purple-800';
      case 'design':
        return 'bg-green-100 text-green-800';
      case 'report':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    return '📁';
  };

  const filteredDocuments = documents.filter(doc => {
    if (filterCategory !== 'all' && doc.category !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FolderOpen className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Document Management</h2>
            <p className="text-sm text-slate-600">Share and organize project files</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Upload className="w-4 h-4" />
          Upload Document
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

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Filter by Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="contract">Contracts</option>
            <option value="requirement">Requirements</option>
            <option value="design">Designs</option>
            <option value="report">Reports</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload New Document</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Project Requirements.pdf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Document['category'] })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="contract">Contract</option>
                  <option value="requirement">Requirement</option>
                  <option value="design">Design</option>
                  <option value="report">Report</option>
                  <option value="other">Other</option>
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
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Document description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File URL
                </label>
                <input
                  type="url"
                  required
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File Type
                </label>
                <input
                  type="text"
                  required
                  value={formData.file_type}
                  onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., application/pdf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File Size (bytes)
                </label>
                <input
                  type="number"
                  required
                  value={formData.file_size}
                  onChange={(e) => setFormData({ ...formData, file_size: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="1.0"
                />
              </div>

              <div className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-slate-700">
                  Make this document public
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Upload Document
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedProject && filteredDocuments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-3xl">{getFileIcon(doc.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate mb-1">{doc.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => togglePublic(doc)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                  title={doc.is_public ? 'Make private' : 'Make public'}
                >
                  {doc.is_public ? (
                    <Unlock className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>

              {doc.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{doc.description}</p>
              )}

              <div className="space-y-2 mb-4 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Size:</span>
                  <span className="font-medium text-slate-700">{formatFileSize(doc.file_size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Version:</span>
                  <span className="font-medium text-slate-700">{doc.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uploaded by:</span>
                  <span className="font-medium text-slate-700">{doc.uploader?.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View
                </a>
                <a
                  href={doc.file_url}
                  download={doc.name}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                {doc.uploaded_by === profile?.id && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && filteredDocuments.length === 0 && !showForm && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No documents yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload First Document
          </button>
        </div>
      )}
    </div>
  );
}

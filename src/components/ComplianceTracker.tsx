import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Plus, CheckCircle2, XCircle, AlertCircle, Edit2, Trash2 } from 'lucide-react';

interface Standard {
  id: string;
  name: string;
  description: string;
  category: string;
  requirements: any[];
  is_active: boolean;
}

interface Assessment {
  id: string;
  standard_id: string;
  project_id: string | null;
  assessed_by: string;
  assessment_date: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'in_progress';
  score: number;
  findings: any[];
  action_items: any[];
  next_review_date: string | null;
  standard?: Standard;
  project?: { name: string };
}

export default function ComplianceTracker() {
  const { profile } = useAuth();
  const [standards, setStandards] = useState<Standard[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [formData, setFormData] = useState({
    standard_id: '',
    project_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    status: 'in_progress' as Assessment['status'],
    score: 0,
    findings: '',
    action_items: '',
    next_review_date: '',
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      const [standardsRes, assessmentsRes, projectsRes] = await Promise.all([
        supabase.from('compliance_standards').select('*').eq('is_active', true),
        supabase.from('compliance_assessments').select(`
          *,
          standard:standard_id(name, category),
          project:project_id(name)
        `).order('assessment_date', { ascending: false }),
        supabase.from('projects').select('id, name'),
      ]);

      if (standardsRes.error) throw standardsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setStandards(standardsRes.data || []);
      setAssessments(assessmentsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const findings = formData.findings.split('\n').filter(f => f.trim()).map(f => ({ description: f.trim() }));
      const actionItems = formData.action_items.split('\n').filter(a => a.trim()).map(a => ({ action: a.trim() }));

      const { error } = await supabase.from('compliance_assessments').insert({
        standard_id: formData.standard_id,
        project_id: formData.project_id || null,
        assessed_by: profile.id,
        assessment_date: formData.assessment_date,
        status: formData.status,
        score: formData.score,
        findings,
        action_items: actionItems,
        next_review_date: formData.next_review_date || null,
      });

      if (error) throw error;

      setFormData({
        standard_id: '',
        project_id: '',
        assessment_date: new Date().toISOString().split('T')[0],
        status: 'in_progress',
        score: 0,
        findings: '',
        action_items: '',
        next_review_date: '',
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assessment?')) return;

    try {
      const { error } = await supabase.from('compliance_assessments').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting assessment:', error);
    }
  };

  const getStatusColor = (status: Assessment['status']) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'non_compliant':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: Assessment['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'non_compliant':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const stats = {
    compliant: assessments.filter(a => a.status === 'compliant').length,
    nonCompliant: assessments.filter(a => a.status === 'non_compliant').length,
    partial: assessments.filter(a => a.status === 'partial').length,
    avgScore: assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length)
      : 0,
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading compliance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Compliance Tracker</h2>
            <p className="text-sm text-slate-600">Monitor regulatory compliance and standards</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <CheckCircle2 className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.compliant}</div>
          <div className="text-green-100 text-sm">Compliant</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6">
          <XCircle className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.nonCompliant}</div>
          <div className="text-red-100 text-sm">Non-Compliant</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6">
          <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.partial}</div>
          <div className="text-yellow-100 text-sm">Partial</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <ShieldCheck className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.avgScore}%</div>
          <div className="text-blue-100 text-sm">Avg Score</div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">New Compliance Assessment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Standard
                </label>
                <select
                  required
                  value={formData.standard_id}
                  onChange={(e) => setFormData({ ...formData, standard_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select standard...</option>
                  {standards.map((standard) => (
                    <option key={standard.id} value={standard.id}>
                      {standard.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project (Optional)
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Platform-wide</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assessment Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.assessment_date}
                  onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Assessment['status'] })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="compliant">Compliant</option>
                  <option value="partial">Partial</option>
                  <option value="non_compliant">Non-Compliant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Score: {formData.score}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Findings (one per line)
              </label>
              <textarea
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="List compliance gaps or issues..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Action Items (one per line)
              </label>
              <textarea
                value={formData.action_items}
                onChange={(e) => setFormData({ ...formData, action_items: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="List required remediation actions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Next Review Date
              </label>
              <input
                type="date"
                value={formData.next_review_date}
                onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Assessment
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Compliance Standards</h3>
          {standards.map((standard) => (
            <div
              key={standard.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedStandard(standard)}
            >
              <h4 className="font-semibold text-slate-900 mb-2">{standard.name}</h4>
              <p className="text-sm text-slate-600 mb-3">{standard.description}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {standard.category.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-500">
                  {standard.requirements.length} requirements
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Recent Assessments</h3>
          {assessments.slice(0, 10).map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getStatusIcon(assessment.status)}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {assessment.standard?.name}
                    </h4>
                    {assessment.project && (
                      <p className="text-sm text-slate-600 mb-2">
                        Project: {assessment.project.name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {assessment.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        Score: {assessment.score}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Assessed: {new Date(assessment.assessment_date).toLocaleDateString()}
                      {assessment.next_review_date && (
                        <> • Next review: {new Date(assessment.next_review_date).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(assessment.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {assessment.findings && assessment.findings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Findings:</p>
                  <ul className="space-y-1">
                    {assessment.findings.slice(0, 3).map((finding: any, idx: number) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {finding.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {assessments.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No assessments yet</p>
            </div>
          )}
        </div>
      </div>

      {selectedStandard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedStandard.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedStandard.description}</p>
              </div>
              <button
                onClick={() => setSelectedStandard(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Requirements:</h4>
              {selectedStandard.requirements.map((req: any, idx: number) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {req.id}
                    </span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-900 mb-1">{req.title}</h5>
                      <p className="text-sm text-slate-600">{req.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '../shared/hooks/useToast';

interface PrivacyRequest {
  id: string;
  request_type: 'access' | 'deletion' | 'rectification' | 'portability' | 'objection';
  requester_email: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requested_date: string;
  completed_date: string | null;
  data_categories: string[];
  notes: string;
}

export default function DataPrivacy() {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    request_type: 'access' as PrivacyRequest['request_type'],
    data_categories: '',
    notes: '',
  });

  useEffect(() => {
    loadRequests();
  }, [profile]);

  const loadRequests = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('data_privacy_requests')
        .select('*')
        .or(`user_id.eq.${profile.id},handled_by.eq.${profile.id}`)
        .order('requested_date', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const categories = formData.data_categories.split(',').map(c => c.trim()).filter(Boolean);

      const { error } = await supabase.from('data_privacy_requests').insert({
        request_type: formData.request_type,
        user_id: profile.id,
        requester_email: profile.email,
        data_categories: categories,
        notes: formData.notes,
      });

      if (error) throw error;

      setFormData({
        request_type: 'access',
        data_categories: '',
        notes: '',
      });
      setShowForm(false);
      showSuccess('Privacy request submitted successfully');
      loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      showError('Failed to submit privacy request');
    }
  };

  const getStatusColor = (status: PrivacyRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading privacy requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Lock className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Data Privacy & GDPR</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage data subject requests</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Submit Privacy Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Request Type
              </label>
              <select
                value={formData.request_type}
                onChange={(e) => setFormData({ ...formData, request_type: e.target.value as PrivacyRequest['request_type'] })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="access">Access My Data</option>
                <option value="deletion">Delete My Data</option>
                <option value="rectification">Correct My Data</option>
                <option value="portability">Export My Data</option>
                <option value="objection">Object to Processing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Categories (comma-separated)
              </label>
              <input
                type="text"
                value={formData.data_categories}
                onChange={(e) => setFormData({ ...formData, data_categories: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="e.g., profile, projects, messages"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Details
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Provide any additional information..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {request.request_type.replace('_', ' ')} Request
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Submitted: {new Date(request.requested_date).toLocaleDateString()}
                  </div>
                  {request.completed_date && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed: {new Date(request.completed_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {request.data_categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {request.data_categories.map((cat, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {request.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{request.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <Lock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No privacy requests</p>
          </div>
        )}
      </div>
    </div>
  );
}

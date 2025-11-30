import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, AlertTriangle, Plus, Users } from 'lucide-react';
import { useToast } from '../shared/hooks/useToast';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  incident_type: string;
  reported_date: string;
}

interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  resource_type: string;
  role: string;
  is_active: boolean;
}

export default function SecurityManagement() {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incidents' | 'policies'>('incidents');
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    severity: 'medium' as Incident['severity'],
    incident_type: 'other',
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      const [incidentsRes, policiesRes] = await Promise.all([
        supabase.from('security_incidents').select('*').order('reported_date', { ascending: false }).limit(20),
        supabase.from('access_control_policies').select('*').eq('is_active', true),
      ]);

      if (incidentsRes.error) throw incidentsRes.error;
      if (policiesRes.error) throw policiesRes.error;

      setIncidents(incidentsRes.data || []);
      setPolicies(policiesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase.from('security_incidents').insert({
        ...incidentForm,
        reported_by: profile.id,
      });

      if (error) throw error;

      setIncidentForm({
        title: '',
        description: '',
        severity: 'medium',
        incident_type: 'other',
      });
      setShowIncidentForm(false);
      showSuccess('Incident reported successfully');
      loadData();
    } catch (error) {
      console.error('Error creating incident:', error);
      showError('Failed to report incident');
    }
  };

  const getSeverityColor = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading security data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Security Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Incidents and access control</p>
          </div>
        </div>

        {activeTab === 'incidents' && (
          <button
            onClick={() => setShowIncidentForm(!showIncidentForm)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Plus className="w-4 h-4" />
            Report Incident
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                activeTab === 'incidents'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              Security Incidents
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                activeTab === 'policies'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              Access Policies
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              {showIncidentForm && (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Report Security Incident</h3>
                  <form onSubmit={handleIncidentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        value={incidentForm.title}
                        onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        required
                        value={incidentForm.description}
                        onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Severity
                        </label>
                        <select
                          value={incidentForm.severity}
                          onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value as Incident['severity'] })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Incident Type
                        </label>
                        <select
                          value={incidentForm.incident_type}
                          onChange={(e) => setIncidentForm({ ...incidentForm, incident_type: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="breach">Data Breach</option>
                          <option value="malware">Malware</option>
                          <option value="phishing">Phishing</option>
                          <option value="unauthorized_access">Unauthorized Access</option>
                          <option value="dos">Denial of Service</option>
                          <option value="data_loss">Data Loss</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Report Incident
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowIncidentForm(false)}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{incident.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{incident.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>Type: {incident.incident_type.replace('_', ' ')}</span>
                        <span>Reported: {new Date(incident.reported_date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {incidents.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No incidents reported</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{policy.name}</h3>
                      {policy.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{policy.description}</p>
                      )}
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded text-xs font-medium">
                          {policy.resource_type}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded text-xs font-medium capitalize">
                          {policy.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {policies.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No access policies defined</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

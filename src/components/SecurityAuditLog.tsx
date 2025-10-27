import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, Activity, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure' | 'blocked';
  details: any;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export default function SecurityAuditLog() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, [profile]);

  const loadLogs = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select(`
          *,
          user:user_id(full_name, email)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusIcon = (status: AuditLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'blocked':
        return <Shield className="w-4 h-4 text-orange-600" />;
    }
  };

  const getSeverityColor = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status: AuditLog['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failure':
        return 'bg-red-100 text-red-800';
      case 'blocked':
        return 'bg-orange-100 text-orange-800';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    if (filterAction !== 'all' && log.action_type !== filterAction) return false;
    if (searchQuery && !log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.resource_type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action_type))];

  const stats = {
    total: logs.length,
    critical: logs.filter(l => l.severity === 'critical').length,
    failures: logs.filter(l => l.status === 'failure' || l.status === 'blocked').length,
    today: logs.filter(l => {
      const logDate = new Date(l.created_at);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Security Audit Log</h2>
            <p className="text-sm text-slate-600">Monitor security events and activities</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <Activity className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.total}</div>
          <div className="text-blue-100 text-sm">Total Events</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6">
          <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.critical}</div>
          <div className="text-red-100 text-sm">Critical Events</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
          <XCircle className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.failures}</div>
          <div className="text-orange-100 text-sm">Failures</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <CheckCircle2 className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.today}</div>
          <div className="text-green-100 text-sm">Today's Events</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getSeverityIcon(log.severity)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-900">{log.action_type}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        <span className="ml-1">{log.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Resource:</span> {log.resource_type}
                      </div>
                      {log.user && (
                        <div>
                          <span className="font-medium">User:</span> {log.user.full_name}
                        </div>
                      )}
                      {log.ip_address && (
                        <div>
                          <span className="font-medium">IP:</span> {log.ip_address}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Time:</span>{' '}
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                          View Details
                        </summary>
                        <pre className="mt-2 p-3 bg-slate-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

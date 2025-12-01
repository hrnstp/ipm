import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Connection, Profile } from '../lib/supabase';
import { UserPlus, Check, X, Send, Users, MessageCircle } from 'lucide-react';
import { useToast } from '../shared/hooks/useToast';
import { EmptyState } from '../shared/components/ui';

export default function ConnectionsManager() {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [connections, setConnections] = useState<(Connection & {
    initiator: Profile;
    recipient: Profile;
  })[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConnection, setShowNewConnection] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  useEffect(() => {
    loadConnections();
    loadAvailableUsers();
  }, [profile]);

  const loadConnections = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          initiator:profiles!initiator_id(*),
          recipient:profiles!recipient_id(*)
        `)
        .or(`initiator_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const sendConnectionRequest = async (recipientId: string, message: string, type: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase.from('connections').insert([{
        initiator_id: profile.id,
        recipient_id: recipientId,
        message,
        connection_type: type,
        status: 'pending',
      }]);

      if (error) throw error;
      await loadConnections();
      setShowNewConnection(false);
    } catch (error) {
      console.error('Error sending connection:', error);
      showError('Failed to send connection request');
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) throw error;
      await loadConnections();
    } catch (error) {
      console.error('Error updating connection:', error);
    }
  };

  const filteredConnections = connections.filter((conn) => {
    if (filter === 'all') return true;
    return conn.status === filter;
  });

  const pendingRequests = connections.filter(
    (c) => c.status === 'pending' && c.recipient_id === profile?.id
  );

  const NewConnectionModal = () => {
    const [selectedUser, setSelectedUser] = useState('');
    const [message, setMessage] = useState('');
    const [connectionType, setConnectionType] = useState<'partnership' | 'inquiry' | 'collaboration'>('inquiry');

    const connectedUserIds = new Set(connections.map(c =>
      c.initiator_id === profile?.id ? c.recipient_id : c.initiator_id
    ));

    const unconnectedUsers = availableUsers.filter(u => !connectedUserIds.has(u.id));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedUser && message) {
        sendConnectionRequest(selectedUser, message, connectionType);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">New Connection Request</h3>
            <button onClick={() => setShowNewConnection(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Choose a user</option>
                {unconnectedUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} - {user.organization} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Connection Type</label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value as any)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="inquiry">Inquiry</option>
                <option value="partnership">Partnership</option>
                <option value="collaboration">Collaboration</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Introduce yourself and explain why you'd like to connect..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Send Connection Request
            </button>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading connections...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All ({connections.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Pending ({connections.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Accepted ({connections.filter(c => c.status === 'accepted').length})
          </button>
        </div>

        <button
          onClick={() => setShowNewConnection(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          <UserPlus className="w-5 h-5" />
          New Connection
        </button>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Pending Requests ({pendingRequests.length})
          </h4>
          <div className="space-y-2">
            {pendingRequests.map((conn) => (
              <div key={conn.id} className="bg-white rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{conn.initiator.full_name}</p>
                  <p className="text-sm text-slate-600">{conn.initiator.organization} - {conn.initiator.role}</p>
                  <p className="text-sm text-slate-500 mt-1">{conn.message}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateConnectionStatus(conn.id, 'accepted')}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateConnectionStatus(conn.id, 'rejected')}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredConnections.map((conn) => {
          const isInitiator = conn.initiator_id === profile?.id;
          const otherUser = isInitiator ? conn.recipient : conn.initiator;

          return (
            <div key={conn.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 font-semibold text-lg">
                    {otherUser.full_name[0]}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{otherUser.full_name}</h4>
                      <p className="text-sm text-slate-600">{otherUser.organization}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      conn.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      conn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {conn.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <span className="capitalize">{otherUser.role}</span>
                    <span>•</span>
                    <span>{otherUser.country}</span>
                  </div>

                  <p className="text-sm text-slate-600 bg-slate-50 rounded p-2 mt-2">
                    {conn.message}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 rounded capitalize">
                      {conn.connection_type}
                    </span>
                    <span>•</span>
                    <span>{new Date(conn.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredConnections.length === 0 && (
        <EmptyState
          icon={Users}
          title="No connections found"
          description={
            filter !== 'all'
              ? `No ${filter} connections. Try viewing all connections.`
              : "Build your network! Connect with municipalities, developers, and integrators to explore collaboration opportunities."
          }
          action={{ label: 'Find Connections', onClick: () => setShowNewConnection(true) }}
        />
      )}

      {showNewConnection && <NewConnectionModal />}
    </div>
  );
}

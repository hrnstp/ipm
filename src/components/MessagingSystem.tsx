import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile } from '../lib/supabase';
import { Send, Search, Mail, MailOpen, X, ArrowLeft } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  read: boolean;
  project_id?: string;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
}

export default function MessagingSystem() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'inbox' | 'sent'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    loadMessages();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${profile?.id}`,
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter, profile]);

  const loadMessages = async () => {
    if (!profile) return;

    try {
      const query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(*),
          recipient:profiles!recipient_id(*)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'inbox') {
        query.eq('recipient_id', profile.id);
      } else {
        query.eq('sender_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, read: true } : m
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read && message.recipient_id === profile?.id) {
      markAsRead(message.id);
    }
  };

  const filteredMessages = messages.filter((message) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      message.subject.toLowerCase().includes(searchLower) ||
      message.content.toLowerCase().includes(searchLower) ||
      (filter === 'inbox' && message.sender?.full_name.toLowerCase().includes(searchLower)) ||
      (filter === 'sent' && message.recipient?.full_name.toLowerCase().includes(searchLower))
    );
  });

  const unreadCount = messages.filter(m => !m.read && m.recipient_id === profile?.id).length;

  const ComposeMessage = () => {
    const [contacts, setContacts] = useState<Profile[]>([]);
    const [formData, setFormData] = useState({
      recipient_id: '',
      subject: '',
      content: '',
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
      loadContacts();
    }, []);

    const loadContacts = async () => {
      if (!profile) return;

      try {
        const { data, error } = await supabase
          .from('connections')
          .select(`
            initiator:profiles!initiator_id(*),
            recipient:profiles!recipient_id(*)
          `)
          .eq('status', 'accepted')
          .or(`initiator_id.eq.${profile.id},recipient_id.eq.${profile.id}`);

        if (error) throw error;

        const contactsList = data?.map(conn =>
          conn.initiator.id === profile.id ? conn.recipient : conn.initiator
        ) || [];

        setContacts(contactsList);
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };

    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile) return;

      setSending(true);
      try {
        const { error } = await supabase.from('messages').insert([{
          sender_id: profile.id,
          recipient_id: formData.recipient_id,
          subject: formData.subject,
          content: formData.content,
          read: false,
        }]);

        if (error) throw error;

        setShowCompose(false);
        loadMessages();
        alert('Message sent successfully!');
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-themed-secondary rounded-xl max-w-2xl w-full border border-themed-primary">
          <div className="p-6 border-b border-themed-primary flex justify-between items-center">
            <h3 className="text-xl font-bold text-themed-primary">New Message</h3>
            <button onClick={() => setShowCompose(false)} className="text-themed-tertiary hover:text-themed-primary">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">To</label>
              <select
                required
                value={formData.recipient_id}
                onChange={(e) => setFormData({ ...formData, recipient_id: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              >
                <option value="">Select contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.full_name} - {contact.organization}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-themed-secondary mb-1">Message</label>
              <textarea
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-6 py-3 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-themed-secondary">Loading messages...</div>;
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-300px)]">
      <div className="w-80 flex flex-col gap-4">
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          <Send className="w-5 h-5" />
          Compose
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => { setFilter('inbox'); setSelectedMessage(null); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              filter === 'inbox'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-themed-hover text-themed-secondary'
            }`}
          >
            Inbox {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => { setFilter('sent'); setSelectedMessage(null); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              filter === 'sent'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-themed-hover text-themed-secondary'
            }`}
          >
            Sent
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-themed-tertiary w-5 h-5" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredMessages.map((message) => (
            <button
              key={message.id}
              onClick={() => handleSelectMessage(message)}
              className={`w-full p-4 rounded-lg text-left transition ${
                selectedMessage?.id === message.id
                  ? 'bg-emerald-100 dark:bg-emerald-900 border-2 border-emerald-600'
                  : 'bg-themed-secondary border border-themed-primary hover:bg-themed-hover'
              }`}
            >
              <div className="flex items-start gap-3">
                {!message.read && filter === 'inbox' && (
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {message.read || filter === 'sent' ? (
                      <MailOpen className="w-4 h-4 text-themed-tertiary flex-shrink-0" />
                    ) : (
                      <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm text-themed-primary truncate">
                      {filter === 'inbox' ? message.sender?.full_name : message.recipient?.full_name}
                    </span>
                  </div>
                  <p className="font-medium text-themed-primary text-sm mb-1 truncate">{message.subject}</p>
                  <p className="text-xs text-themed-tertiary truncate">{message.content}</p>
                  <p className="text-xs text-themed-tertiary mt-1">
                    {new Date(message.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}

          {filteredMessages.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-themed-tertiary mx-auto mb-4" />
              <p className="text-themed-secondary">No messages found</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-themed-secondary border border-themed-primary rounded-xl">
        {selectedMessage ? (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-themed-primary">
              <button
                onClick={() => setSelectedMessage(null)}
                className="flex items-center gap-2 text-themed-secondary hover:text-themed-primary mb-4 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to messages
              </button>
              <h2 className="text-2xl font-bold text-themed-primary mb-2">{selectedMessage.subject}</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    {filter === 'inbox'
                      ? selectedMessage.sender?.full_name[0]
                      : selectedMessage.recipient?.full_name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-themed-primary">
                    {filter === 'inbox' ? (
                      <>From: {selectedMessage.sender?.full_name}</>
                    ) : (
                      <>To: {selectedMessage.recipient?.full_name}</>
                    )}
                  </p>
                  <p className="text-sm text-themed-tertiary">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <p className="text-themed-primary whitespace-pre-wrap leading-relaxed">
                {selectedMessage.content}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Mail className="w-16 h-16 text-themed-tertiary mx-auto mb-4" />
              <p className="text-themed-secondary">Select a message to read</p>
            </div>
          </div>
        )}
      </div>

      {showCompose && <ComposeMessage />}
    </div>
  );
}

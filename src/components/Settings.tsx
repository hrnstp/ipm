import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../shared/hooks/useToast';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  BellOff, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Trash2,
  Save,
  Globe,
  Mail,
  MessageSquare,
  FileText,
  AlertTriangle
} from 'lucide-react';

type SettingsTab = 'general' | 'notifications' | 'privacy' | 'account';

interface NotificationSettings {
  email_messages: boolean;
  email_projects: boolean;
  email_rfp: boolean;
  email_connections: boolean;
  browser_notifications: boolean;
}

interface PrivacySettings {
  profile_visible: boolean;
  show_email: boolean;
  show_location: boolean;
}

export default function Settings() {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);
  
  // General settings
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');
  
  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_messages: true,
    email_projects: true,
    email_rfp: true,
    email_connections: true,
    browser_notifications: false,
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profile_visible: true,
    show_email: false,
    show_location: true,
  });
  
  // Account settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Detect current theme mode
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setSelectedTheme(storedTheme);
    } else {
      setSelectedTheme('system');
    }
    
    // Load user settings from profile if available
    if (profile?.settings) {
      const settings = profile.settings as any;
      if (settings.notifications) {
        setNotifications(prev => ({ ...prev, ...settings.notifications }));
      }
      if (settings.privacy) {
        setPrivacy(prev => ({ ...prev, ...settings.privacy }));
      }
      if (settings.language) {
        setLanguage(settings.language);
      }
    }
  }, [profile]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(newTheme);
    
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(newTheme);
    }
  };

  const handleSaveSettings = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          settings: {
            notifications,
            privacy,
            language,
          },
        })
        .eq('id', profile.id);

      if (error) throw error;
      showSuccess('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // This would require admin functions in Supabase
    showError('Account deletion requires contacting support');
    setShowDeleteConfirm(false);
  };

  const requestBrowserNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifications(prev => ({ ...prev, browser_notifications: true }));
        showSuccess('Browser notifications enabled!');
      } else {
        showError('Browser notifications were denied');
      }
    } else {
      showError('Your browser does not support notifications');
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'account', label: 'Account', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs */}
        <div className="md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => handleThemeChange('light')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            selectedTheme === 'light'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Sun className={`w-6 h-6 ${selectedTheme === 'light' ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`} />
                          <span className={`text-sm font-medium ${selectedTheme === 'light' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            Light
                          </span>
                        </button>
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            selectedTheme === 'dark'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Moon className={`w-6 h-6 ${selectedTheme === 'dark' ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`} />
                          <span className={`text-sm font-medium ${selectedTheme === 'dark' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            Dark
                          </span>
                        </button>
                        <button
                          onClick={() => handleThemeChange('system')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            selectedTheme === 'system'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Monitor className={`w-6 h-6 ${selectedTheme === 'system' ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`} />
                          <span className={`text-sm font-medium ${selectedTheme === 'system' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            System
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Language</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interface Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="pt">Português</option>
                      <option value="ar">العربية</option>
                      <option value="ru">Русский</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Language support coming soon
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Email Notifications</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'email_messages', icon: MessageSquare, label: 'New messages', description: 'Receive email when you get a new message' },
                      { key: 'email_projects', icon: FileText, label: 'Project updates', description: 'Notifications about project status changes' },
                      { key: 'email_rfp', icon: FileText, label: 'New RFP listings', description: 'Get notified about new RFP opportunities' },
                      { key: 'email_connections', icon: Mail, label: 'Connection requests', description: 'When someone wants to connect with you' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isEnabled = notifications[item.key as keyof NotificationSettings];
                      return (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !isEnabled }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              isEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                isEnabled ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Browser Notifications</h2>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {notifications.browser_notifications ? (
                          <Bell className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <BellOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Push notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications in your browser</p>
                      </div>
                    </div>
                    {notifications.browser_notifications ? (
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, browser_notifications: false }))}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        onClick={requestBrowserNotifications}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile Visibility</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'profile_visible', icon: Eye, label: 'Public profile', description: 'Allow others to find and view your profile' },
                      { key: 'show_email', icon: Mail, label: 'Show email address', description: 'Display your email on your public profile' },
                      { key: 'show_location', icon: Globe, label: 'Show location', description: 'Display your country and region' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isEnabled = privacy[item.key as keyof PrivacySettings];
                      return (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !isEnabled }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              isEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                isEnabled ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Change Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !newPassword || !confirmPassword}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-red-800 dark:text-red-300">Delete Account</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        {showDeleteConfirm ? (
                          <div className="mt-4 space-y-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                              Are you sure you want to delete your account?
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                              >
                                Yes, delete my account
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="mt-4 flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


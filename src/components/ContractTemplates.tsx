import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, Search, Copy, Eye, X, Download, Plus } from 'lucide-react';
import { useToast } from '../shared/hooks/useToast';

interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  template_content: string;
  variables: string[];
  is_public: boolean;
  usage_count: number;
  created_at: string;
}

export default function ContractTemplates() {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const incrementUsage = async (templateId: string) => {
    try {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      await supabase
        .from('contract_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', templateId);

      loadTemplates();
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccess('Template copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showError('Failed to copy template');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-themed-secondary">Loading contract templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-themed-primary flex items-center gap-3">
          <FileText className="w-8 h-8 text-emerald-600" />
          Contract Templates Library
        </h2>
        <p className="text-themed-secondary mt-1">
          Ready-to-use contract templates for various project types
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-themed-tertiary w-5 h-5" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat} className="capitalize">
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-themed-secondary border border-themed-primary rounded-xl p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-themed-primary mb-1">{template.title}</h3>
                <span className="inline-block px-2 py-1 bg-themed-hover text-themed-secondary rounded text-xs capitalize">
                  {template.category}
                </span>
              </div>
              {template.is_public && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 rounded text-xs font-medium">
                  Public
                </span>
              )}
            </div>

            {template.description && (
              <p className="text-sm text-themed-secondary line-clamp-2 mb-4">{template.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-themed-tertiary mb-4">
              <Copy className="w-4 h-4" />
              <span>Used {template.usage_count} times</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTemplate(template)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => {
                  copyToClipboard(template.template_content);
                  incrementUsage(template.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-themed-tertiary mx-auto mb-4" />
          <p className="text-themed-secondary">No templates found</p>
        </div>
      )}

      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onCopy={() => {
            copyToClipboard(selectedTemplate.template_content);
            incrementUsage(selectedTemplate.id);
          }}
        />
      )}
    </div>
  );
}

function TemplateDetailModal({
  template,
  onClose,
  onCopy,
}: {
  template: ContractTemplate;
  onClose: () => void;
  onCopy: () => void;
}) {
  const [filledVariables, setFilledVariables] = useState<Record<string, string>>({});

  const fillTemplate = () => {
    let filledContent = template.template_content;
    Object.entries(filledVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      filledContent = filledContent.replace(new RegExp(placeholder, 'g'), value);
    });
    return filledContent;
  };

  const downloadTemplate = () => {
    const content = fillTemplate();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-themed-secondary rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
        <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-themed-primary mb-1">{template.title}</h2>
            <p className="text-themed-secondary capitalize">{template.category}</p>
          </div>
          <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {template.description && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-900 dark:text-blue-100">{template.description}</p>
            </div>
          )}

          {template.variables && template.variables.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-themed-primary mb-3">Template Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {template.variables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-sm font-medium text-themed-secondary mb-1">
                      {variable.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={filledVariables[variable] || ''}
                      onChange={(e) =>
                        setFilledVariables({ ...filledVariables, [variable]: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                      placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-themed-primary mb-3">Contract Template</h3>
            <div className="bg-themed-primary border border-themed-primary rounded-lg p-6 font-mono text-sm text-themed-primary whitespace-pre-wrap max-h-96 overflow-y-auto">
              {Object.keys(filledVariables).length > 0 ? fillTemplate() : template.template_content}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCopy}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              <Copy className="w-5 h-5" />
              Copy to Clipboard
            </button>
            <button
              onClick={downloadTemplate}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

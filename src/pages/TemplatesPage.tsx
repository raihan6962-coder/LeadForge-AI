import { useState } from 'react';
import {
  Plus, Search, Eye, Edit2, Copy, Power, Mail,
  FileText, Upload,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { emailTemplates as initialTemplates } from '@/data/mockData';
import type { EmailTemplate } from '@/types';

const allVariables = [
  '{{app_name}}', '{{developer_name}}', '{{rating}}', '{{install_count}}',
  '{{category}}', '{{website}}', '{{country}}',
];

export function TemplatesPage() {
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [search, setSearch] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [showImport, setShowImport] = useState(false);

  const filtered = templates.filter(t => t.keyword.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()));

  const renderPreview = (text: string, variables: string[]) => {
    let rendered = text;
    const sampleValues: Record<string, string> = {
      '{{app_name}}': 'FitTrack Pro',
      '{{developer_name}}': 'FitTech Studios',
      '{{rating}}': '4.5',
      '{{install_count}}': '124K',
      '{{category}}': 'Health & Fitness',
      '{{website}}': 'fittechstudios.com',
      '{{country}}': 'United States',
    };
    variables.forEach(v => {
      rendered = rendered.replaceAll(v, sampleValues[v] || v);
    });
    return rendered;
  };

  const handleDuplicate = (tpl: EmailTemplate) => {
    const copy: EmailTemplate = { ...tpl, id: `tpl-${Date.now()}`, name: `${tpl.name} (Copy)`, status: 'draft' };
    setTemplates(prev => [...prev, copy]);
    addToast('success', 'Template duplicated', `"${tpl.name}" has been duplicated.`);
  };

  const handleToggle = (tpl: EmailTemplate) => {
    setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, status: t.status === 'active' ? 'disabled' : 'active' } : t));
    addToast('info', 'Template updated', `"${tpl.name}" is now ${tpl.status === 'active' ? 'disabled' : 'active'}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Email Template Management</h2>
          <p className="text-xs text-muted mt-0.5">{templates.length} templates · {templates.filter(t => t.status === 'active').length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Upload size={14} />} onClick={() => setShowImport(true)}>Import from Sheets</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditTemplate({ id: '', keyword: '', name: '', subject: '', body: '', variables: [], lastUpdated: '', status: 'draft' })}>New Template</Button>
        </div>
      </div>

      <div className="max-w-md">
        <Input placeholder="Search templates..." icon={<Search size={15} />} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Variable Legend */}
      <Card className="p-4">
        <p className="text-xs text-secondary font-medium mb-2">Available Personalization Variables</p>
        <div className="flex flex-wrap gap-1.5">
          {allVariables.map(v => (
            <span key={v} className="px-2 py-1 rounded-md bg-accent-500/10 text-accent-300 text-xs font-mono border border-accent-500/20">{v}</span>
          ))}
        </div>
      </Card>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tpl => (
          <Card key={tpl.id} hover className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-sm text-primary font-semibold">{tpl.name}</p>
                  <p className="text-[10px] text-muted">{tpl.keyword}</p>
                </div>
              </div>
              <StatusBadge status={tpl.status} showDot={false} />
            </div>

            <div className="card-base p-3 mb-3">
              <p className="text-[10px] text-muted uppercase mb-1">Subject</p>
              <p className="text-xs text-primary line-clamp-2">{tpl.subject}</p>
            </div>

            <div className="card-base p-3 mb-3 max-h-24 overflow-hidden">
              <p className="text-[10px] text-muted uppercase mb-1">Body Preview</p>
              <p className="text-xs text-secondary line-clamp-3 whitespace-pre-line">{tpl.body}</p>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {tpl.variables.slice(0, 4).map(v => (
                <span key={v} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-muted font-mono">{v}</span>
              ))}
              {tpl.variables.length > 4 && <span className="px-1.5 py-0.5 rounded text-[9px] text-muted">+{tpl.variables.length - 4} more</span>}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-[10px] text-muted">Updated {new Date(tpl.lastUpdated).toLocaleDateString()}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPreviewTemplate(tpl)} className="p-1.5 text-muted hover:text-accent-400 transition-colors" title="Preview"><Eye size={14} /></button>
                <button onClick={() => setEditTemplate(tpl)} className="p-1.5 text-muted hover:text-accent-400 transition-colors" title="Edit"><Edit2 size={14} /></button>
                <button onClick={() => handleDuplicate(tpl)} className="p-1.5 text-muted hover:text-accent-400 transition-colors" title="Duplicate"><Copy size={14} /></button>
                <button onClick={() => handleToggle(tpl)} className="p-1.5 text-muted hover:text-accent-400 transition-colors" title="Enable/Disable"><Power size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      <Modal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title="Template Preview"
        subtitle={previewTemplate?.name}
        size="lg"
        footer={<Button variant="ghost" onClick={() => setPreviewTemplate(null)}>Close</Button>}
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div className="card-base p-4">
              <p className="text-[10px] text-muted uppercase mb-1">Subject (Rendered)</p>
              <p className="text-sm text-primary">{renderPreview(previewTemplate.subject, previewTemplate.variables)}</p>
            </div>
            <div className="card-base p-4">
              <p className="text-[10px] text-muted uppercase mb-1">Body (Rendered with sample data)</p>
              <p className="text-sm text-secondary whitespace-pre-line leading-relaxed">{renderPreview(previewTemplate.body, previewTemplate.variables)}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent-500/5 border border-accent-500/15">
              <p className="text-[10px] text-muted mb-1">Variables used in this template:</p>
              <div className="flex flex-wrap gap-1.5">
                {previewTemplate.variables.map(v => <span key={v} className="px-1.5 py-0.5 rounded text-[10px] bg-accent-500/10 text-accent-300 font-mono">{v}</span>)}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        title={editTemplate?.id ? 'Edit Template' : 'New Template'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditTemplate(null)}>Cancel</Button>
            <Button onClick={() => { setEditTemplate(null); addToast('success', 'Template saved', 'Template has been saved successfully.'); }}>Save Template</Button>
          </>
        }
      >
        {editTemplate && (
          <div className="space-y-4">
            <Input label="Template Name" defaultValue={editTemplate.name} placeholder="e.g. Fitness Intro" />
            <Input label="Keyword" defaultValue={editTemplate.keyword} placeholder="e.g. fitness tracker app" />
            <Input label="Subject" defaultValue={editTemplate.subject} placeholder="Partnership opportunity for {{app_name}}" />
            <Textarea label="Body" defaultValue={editTemplate.body} placeholder="Hi {{developer_name}}, ..." className="min-h-[200px]" />
            <div>
              <p className="text-xs text-secondary mb-2">Insert Variable</p>
              <div className="flex flex-wrap gap-1.5">
                {allVariables.map(v => (
                  <button key={v} onClick={() => addToast('info', 'Variable inserted', `${v} inserted at cursor position.`)} className="px-2 py-1 rounded-md bg-white/5 text-xs text-accent-300 font-mono border border-white/10 hover:bg-accent-500/10 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Import from Sheets */}
      <Modal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import from Google Sheets"
        subtitle="Import keyword/template pairs"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button onClick={() => { setShowImport(false); addToast('success', 'Import complete', 'Templates imported from Google Sheets.'); }}>Import</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="card-base p-4">
            <p className="text-xs text-secondary mb-2">Expected sheet structure:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-md bg-white/5 text-center">
                <p className="text-[10px] text-muted uppercase">Column A</p>
                <p className="text-xs text-primary">Keyword</p>
              </div>
              <div className="p-2 rounded-md bg-white/5 text-center">
                <p className="text-[10px] text-muted uppercase">Column B</p>
                <p className="text-xs text-primary">Email Template</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">Make sure your Google Sheets integration is connected before importing.</p>
        </div>
      </Modal>
    </div>
  );
}

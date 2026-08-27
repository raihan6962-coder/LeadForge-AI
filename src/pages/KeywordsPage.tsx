import { useState } from 'react';
import {
  Plus, Search, Upload, Download, GripVertical, MoreVertical,
  Calendar, Tags as TagsIcon, Mail, TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, ProgressBar } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import type { Keyword } from '@/types';

const initialKeywords: Keyword[] = [];

export function KeywordsPage() {
  const { addToast } = useToast();
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editKeyword, setEditKeyword] = useState<Keyword | null>(null);
  const [newKeyword, setNewKeyword] = useState({ keyword: '', day: '', templateId: '' });

  const filtered = keywords.filter(k => k.keyword.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!newKeyword.keyword || !newKeyword.day) {
      addToast('error', 'Missing fields', 'Please enter a keyword and assign a day.');
      return;
    }
    const kw: Keyword = {
      id: `kw-${Date.now()}`,
      keyword: newKeyword.keyword,
      day: parseInt(newKeyword.day),
      date: `2026-08-${String(newKeyword.day).padStart(2, '0')}`,
      status: 'scheduled',
      targetLeads: 1000,
      qualifiedLeads: 0,
      emailsSent: 0,
      replies: 0,
      completion: 0,
      templateId: newKeyword.templateId || null,
      enabled: true,
      relatedQueries: [],
    };
    setKeywords(prev => [...prev, kw]);
    setNewKeyword({ keyword: '', day: '', templateId: '' });
    setShowAdd(false);
    addToast('success', 'Keyword added', `"${kw.keyword}" has been scheduled for Day ${kw.day}.`);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setKeywords(prev => prev.filter(k => k.id !== deleteId));
    setDeleteId(null);
    addToast('info', 'Keyword deleted', 'The keyword has been removed from the schedule.');
  };

  const handleToggle = (id: string) => {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, enabled: !k.enabled, status: !k.enabled ? 'scheduled' : 'disabled' } : k));
  };

  const handleExport = () => {
    addToast('success', 'Export complete', `${keywords.length} keywords exported to CSV.`);
  };

  const handleImport = () => {
    setShowImport(false);
    addToast('success', 'Import complete', 'Keywords imported successfully from file.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Monthly Keyword Schedule</h2>
          <p className="text-xs text-muted mt-0.5">30-day automated keyword rotation — Day 27 of 30</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" icon={<Upload size={14} />} onClick={() => setShowImport(true)}>Import</Button>
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExport}>Export</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add Keyword</Button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search keywords..."
          icon={<Search size={15} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Keyword Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(kw => (
          <Card key={kw.id} hover className="p-4 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                <div>
                  <p className="text-xs text-muted">Day {String(kw.day).padStart(2, '0')}</p>
                  <p className="text-sm font-semibold text-primary mt-0.5">{kw.keyword}</p>
                </div>
              </div>
              <StatusBadge status={kw.status} />
            </div>

            <div className="mb-3">
              <ProgressBar value={kw.qualifiedLeads} max={kw.targetLeads} color={kw.completion === 100 ? 'success' : 'accent'} size="sm" showValue={false} />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-muted">{kw.qualifiedLeads.toLocaleString()} / {kw.targetLeads.toLocaleString()}</span>
                <span className="text-[10px] text-accent-300 font-medium">{kw.completion}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-1.5 rounded-md bg-white/5">
                <p className="text-[9px] text-muted">Qualified</p>
                <p className="text-xs text-success-400 font-medium tabular-nums">{kw.qualifiedLeads}</p>
              </div>
              <div className="text-center p-1.5 rounded-md bg-white/5">
                <p className="text-[9px] text-muted">Sent</p>
                <p className="text-xs text-accent-300 font-medium tabular-nums">{kw.emailsSent}</p>
              </div>
              <div className="text-center p-1.5 rounded-md bg-white/5">
                <p className="text-[9px] text-muted">Replies</p>
                <p className="text-xs text-primary font-medium tabular-nums">{kw.replies}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <Calendar size={11} className="text-muted" />
                <span className="text-[10px] text-muted">{new Date(kw.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                {kw.templateId && (
                  <>
                    <Mail size={11} className="text-muted ml-1.5" />
                    <span className="text-[10px] text-muted">Template</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggle(kw.id)}
                  className={`relative w-7 h-4 rounded-full transition-colors ${kw.enabled ? 'bg-accent-500' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${kw.enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </button>
                <button onClick={() => setEditKeyword(kw)} className="p-1 text-muted hover:text-primary transition-colors">
                  <MoreVertical size={13} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <TagsIcon size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-secondary">No keywords found matching your search.</p>
        </Card>
      )}

      {/* Add Keyword Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Keyword"
        subtitle="Schedule a new keyword for the monthly rotation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Keyword</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Keyword"
            placeholder="e.g. productivity app"
            value={newKeyword.keyword}
            onChange={e => setNewKeyword(prev => ({ ...prev, keyword: e.target.value }))}
          />
          <Input
            label="Day of Month"
            type="number"
            min="1"
            max="30"
            placeholder="e.g. 15"
            value={newKeyword.day}
            onChange={e => setNewKeyword(prev => ({ ...prev, day: e.target.value }))}
          />
          <Input
            label="Email Template ID (optional)"
            placeholder="e.g. tpl-15"
            value={newKeyword.templateId}
            onChange={e => setNewKeyword(prev => ({ ...prev, templateId: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Keywords"
        subtitle="Bulk import keywords from CSV or Google Sheets"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button onClick={handleImport} icon={<Upload size={15} />}>Import</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="card-base p-4">
            <p className="text-xs text-secondary mb-2">Expected CSV format:</p>
            <code className="text-[11px] text-accent-300 font-mono block">keyword,day,template_id</code>
            <code className="text-[11px] text-muted font-mono block mt-1">productivity app,15,tpl-15</code>
          </div>
          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
            <Upload size={24} className="text-muted mx-auto mb-2" />
            <p className="text-xs text-secondary">Drop CSV file here or click to browse</p>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editKeyword}
        onClose={() => setEditKeyword(null)}
        title="Edit Keyword"
        subtitle={editKeyword?.keyword}
        footer={
          <>
            <Button variant="danger" onClick={() => { setDeleteId(editKeyword?.id || null); setEditKeyword(null); }}>Delete</Button>
            <Button variant="ghost" onClick={() => setEditKeyword(null)}>Close</Button>
          </>
        }
      >
        {editKeyword && (
          <div className="space-y-4">
            <Input label="Keyword" defaultValue={editKeyword.keyword} />
            <Input label="Day" type="number" defaultValue={String(editKeyword.day)} />
            <div>
              <p className="text-xs text-secondary mb-2">Related Queries</p>
              <div className="flex flex-wrap gap-1.5">
                {editKeyword.relatedQueries.map(q => (
                  <span key={q} className="px-2 py-1 rounded-md bg-white/5 text-xs text-secondary border border-white/10">{q}</span>
                ))}
                {editKeyword.relatedQueries.length === 0 && <span className="text-xs text-muted">No related queries generated yet</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-base p-3">
                <p className="text-[10px] text-muted">Target Leads</p>
                <p className="text-sm text-primary tabular-nums">{editKeyword.targetLeads.toLocaleString()}</p>
              </div>
              <div className="card-base p-3">
                <p className="text-[10px] text-muted">Qualified</p>
                <p className="text-sm text-success-400 tabular-nums">{editKeyword.qualifiedLeads.toLocaleString()}</p>
              </div>
              <div className="card-base p-3">
                <p className="text-[10px] text-muted">Emails Sent</p>
                <p className="text-sm text-accent-300 tabular-nums">{editKeyword.emailsSent.toLocaleString()}</p>
              </div>
              <div className="card-base p-3">
                <p className="text-[10px] text-muted">Replies</p>
                <p className="text-sm text-primary tabular-nums">{editKeyword.replies.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Keyword"
        message="This will permanently remove the keyword from the monthly schedule. This action cannot be undone."
        confirmLabel="Delete Keyword"
        danger
      />
    </div>
  );
}

import { useState } from 'react';
import {
  Mail, Search, Forward, Archive, Tag as TagIcon, User, Bot,
  Clock, AlertCircle, FileText, MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { replies as initialReplies } from '@/data/mockData';
import type { Reply } from '@/types';

const classIcon: Record<string, typeof User> = {
  human: User,
  automated: Bot,
  out_of_office: Clock,
  bounce: AlertCircle,
  unclear: MessageSquare,
};

export function RepliesPage() {
  const { addToast } = useToast();
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null);

  const filtered = replies.filter(r => {
    if (search && !r.sender.toLowerCase().includes(search.toLowerCase()) && !r.subject.toLowerCase().includes(search.toLowerCase()) && !r.relatedApp.toLowerCase().includes(search.toLowerCase())) return false;
    if (classFilter !== 'all' && r.classification !== classFilter) return false;
    return true;
  });

  const updateReply = (id: string, updates: Partial<Reply>) => {
    setReplies(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    setSelectedReply(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  };

  const humanCount = replies.filter(r => r.classification === 'human').length;
  const autoCount = replies.filter(r => r.classification === 'automated').length;
  const bounceCount = replies.filter(r => r.classification === 'bounce').length;
  const oooCount = replies.filter(r => r.classification === 'out_of_office').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Reply Center</h2>
          <p className="text-xs text-muted mt-0.5">{replies.length} replies · {humanCount} human · {autoCount} automated · {bounceCount} bounce</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-500/5 border border-accent-500/15">
        <MessageSquare size={16} className="text-accent-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-secondary">
          The system does <span className="text-primary font-medium">not</span> automatically respond to human replies by default. All human replies require manual review and action.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input placeholder="Search by sender, subject, or app..." icon={<Search size={15} />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Classifications' },
              { value: 'human', label: 'Human Reply' },
              { value: 'automated', label: 'Automated' },
              { value: 'out_of_office', label: 'Out of Office' },
              { value: 'bounce', label: 'Bounce' },
              { value: 'unclear', label: 'Unclear' },
            ]}
          />
        </div>
      </div>

      {/* Reply List */}
      <div className="space-y-2">
        {filtered.map(reply => {
          const Icon = classIcon[reply.classification] || MessageSquare;
          return (
            <Card key={reply.id} hover className="p-4" onClick={() => { setSelectedReply(reply); if (reply.status === 'new') updateReply(reply.id, { status: 'read' }); }}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  reply.classification === 'human' ? 'bg-accent-500/10 text-accent-400' :
                  reply.classification === 'bounce' ? 'bg-error-500/10 text-error-400' :
                  reply.classification === 'out_of_office' ? 'bg-warning-500/10 text-warning-400' :
                  'bg-white/5 text-muted'
                }`}>
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-primary font-medium truncate">{reply.sender}</p>
                    {reply.status === 'new' && <span className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0 animate-pulse" />}
                    <StatusBadge status={reply.classification} showDot={false} />
                    {reply.forwarded && <StatusBadge status="forwarded" showDot={false} />}
                  </div>
                  <p className="text-xs text-secondary truncate">{reply.subject}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted">{reply.relatedApp}</span>
                    <span className="text-[10px] text-muted">·</span>
                    <span className="text-[10px] text-muted">{reply.keyword}</span>
                    <span className="text-[10px] text-muted">·</span>
                    <span className="text-[10px] text-muted">{new Date(reply.receivedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateReply(reply.id, { classification: 'human' }); addToast('success', 'Marked as human', 'Reply classified as human.'); }}
                    className="p-1.5 text-muted hover:text-accent-400 transition-colors"
                    title="Mark as Human"
                  >
                    <User size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateReply(reply.id, { classification: 'automated' }); addToast('info', 'Marked as automated', 'Reply classified as automated.'); }}
                    className="p-1.5 text-muted hover:text-accent-400 transition-colors"
                    title="Mark as Automated"
                  >
                    <Bot size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateReply(reply.id, { forwarded: true, status: 'forwarded' }); addToast('success', 'Reply forwarded', 'Reply has been forwarded.'); }}
                    className="p-1.5 text-muted hover:text-accent-400 transition-colors"
                    title="Forward"
                  >
                    <Forward size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateReply(reply.id, { status: 'archived' }); addToast('info', 'Reply archived', 'Reply has been archived.'); }}
                    className="p-1.5 text-muted hover:text-accent-400 transition-colors"
                    title="Archive"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Reply Detail Drawer */}
      <Drawer
        open={!!selectedReply}
        onClose={() => setSelectedReply(null)}
        title="Reply Details"
        subtitle={selectedReply?.sender}
        width="lg"
      >
        {selectedReply && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selectedReply.classification} size="md" />
              <StatusBadge status={selectedReply.status} size="md" />
            </div>

            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><Mail size={13} /> Email Details</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] text-muted uppercase">Sender</p><p className="text-sm text-primary">{selectedReply.sender}</p></div>
                  <div><p className="text-[10px] text-muted uppercase">Email</p><p className="text-sm text-primary truncate">{selectedReply.email}</p></div>
                  <div><p className="text-[10px] text-muted uppercase">Subject</p><p className="text-sm text-primary">{selectedReply.subject}</p></div>
                  <div><p className="text-[10px] text-muted uppercase">Received</p><p className="text-sm text-primary">{new Date(selectedReply.receivedAt).toLocaleString()}</p></div>
                </div>
              </div>
            </div>

            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><FileText size={13} /> Reply Body</h4>
              <p className="text-sm text-secondary whitespace-pre-line leading-relaxed">{selectedReply.body}</p>
            </div>

            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Context</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[10px] text-muted uppercase">Related App</p><p className="text-sm text-primary">{selectedReply.relatedApp}</p></div>
                <div><p className="text-[10px] text-muted uppercase">Keyword</p><p className="text-sm text-primary">{selectedReply.keyword}</p></div>
                <div><p className="text-[10px] text-muted uppercase">Original Outreach</p><p className="text-sm text-primary">{new Date(selectedReply.originalOutreach).toLocaleString()}</p></div>
                <div><p className="text-[10px] text-muted uppercase">Forwarded</p><p className="text-sm text-primary">{selectedReply.forwarded ? 'Yes' : 'No'}</p></div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" icon={<User size={14} />} onClick={() => { updateReply(selectedReply.id, { classification: 'human' }); addToast('success', 'Marked as human', 'Reply classified as human.'); }}>Mark as Human</Button>
              <Button size="sm" variant="secondary" icon={<Bot size={14} />} onClick={() => { updateReply(selectedReply.id, { classification: 'automated' }); addToast('info', 'Marked as automated', 'Reply classified as automated.'); }}>Mark as Automated</Button>
              <Button size="sm" variant="secondary" icon={<Forward size={14} />} onClick={() => { updateReply(selectedReply.id, { forwarded: true, status: 'forwarded' }); addToast('success', 'Reply forwarded', 'Reply has been forwarded.'); }}>Forward</Button>
              <Button size="sm" variant="ghost" icon={<Archive size={14} />} onClick={() => { updateReply(selectedReply.id, { status: 'archived' }); setSelectedReply(null); addToast('info', 'Reply archived', 'Reply has been archived.'); }}>Archive</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

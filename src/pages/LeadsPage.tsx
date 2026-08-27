import { useState, useMemo } from 'react';
import {
  Search, Filter, Download, Eye, Star, Mail, Globe, Tag as TagIcon,
  X, ChevronDown, FileText, History,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Modal';
import { DataTable, Pagination } from '@/components/ui/DataTable';
import { useToast } from '@/contexts/ToastContext';
import type { Lead } from '@/types';

const allLeads: Lead[] = [];

const PAGE_SIZE = 10;

export function LeadsPage() {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [qualFilter, setQualFilter] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
  const [replyFilter, setReplyFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return allLeads.filter(l => {
      if (search && !l.appName.toLowerCase().includes(search.toLowerCase()) && !l.developer.toLowerCase().includes(search.toLowerCase()) && !l.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (qualFilter !== 'all' && l.qualificationStatus !== qualFilter) return false;
      if (outreachFilter !== 'all' && l.outreachStatus !== outreachFilter) return false;
      if (replyFilter !== 'all' && l.replyStatus !== replyFilter) return false;
      return true;
    });
  }, [search, qualFilter, outreachFilter, replyFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: 'id', label: 'Lead ID', sortable: true, width: '90px' },
    { key: 'appName', label: 'App Name', sortable: true },
    { key: 'developer', label: 'Developer' },
    { key: 'rating', label: 'Rating', align: 'center' as const, width: '60px' },
    { key: 'installCount', label: 'Installs', align: 'right' as const },
    { key: 'country', label: 'Country', width: '60px' },
    { key: 'email', label: 'Email' },
    { key: 'emailValidity', label: 'Email Validity', width: '90px' },
    { key: 'leadScore', label: 'Score', align: 'center' as const, width: '50px' },
    { key: 'qualificationStatus', label: 'Status', width: '90px' },
    { key: 'outreachStatus', label: 'Outreach', width: '80px' },
    { key: 'replyStatus', label: 'Reply', width: '70px' },
  ];

  const rows = pageRows.map(l => ({
    id: l.id,
    appName: <span className="text-primary font-medium">{l.appName}</span>,
    developer: l.developer,
    rating: <span className="flex items-center gap-0.5 justify-center"><Star size={10} className="text-warning-400" />{l.rating}</span>,
    installCount: l.installCount > 1000 ? `${(l.installCount / 1000).toFixed(0)}K` : l.installCount,
    country: l.country,
    email: l.email || <span className="text-muted">—</span>,
    emailValidity: <StatusBadge status={l.emailValidity} showDot={false} />,
    leadScore: <span className={`font-medium tabular-nums ${l.leadScore >= 80 ? 'text-success-400' : l.leadScore >= 60 ? 'text-accent-300' : 'text-warning-400'}`}>{l.leadScore}</span>,
    qualificationStatus: <StatusBadge status={l.qualificationStatus} />,
    outreachStatus: <StatusBadge status={l.outreachStatus} />,
    replyStatus: <StatusBadge status={l.replyStatus} />,
  }));

  const hasActiveFilters = qualFilter !== 'all' || outreachFilter !== 'all' || replyFilter !== 'all';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Lead Database</h2>
          <p className="text-xs text-muted mt-0.5">{filtered.length} leads · {selectedIds.length} selected</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => { addToast('success', 'Export complete', `${selectedIds.length} leads exported.`); }}>
              Export Selected
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => addToast('success', 'Export complete', `${filtered.length} leads exported.`)}>Export All</Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by app name, developer, or ID..."
            icon={<Search size={15} />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Button variant="outline" size="md" icon={<Filter size={15} />} onClick={() => setShowFilters(!showFilters)}>
          Filters {hasActiveFilters && <span className="ml-1 px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-300 text-[9px]">{[qualFilter, outreachFilter, replyFilter].filter(f => f !== 'all').length}</span>}
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 card-base animate-slide-up">
          <Select
            label="Qualification"
            value={qualFilter}
            onChange={e => { setQualFilter(e.target.value); setPage(1); }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
          <Select
            label="Outreach"
            value={outreachFilter}
            onChange={e => { setOutreachFilter(e.target.value); setPage(1); }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'none', label: 'None' },
              { value: 'queued', label: 'Queued' },
              { value: 'sent', label: 'Sent' },
              { value: 'failed', label: 'Failed' },
              { value: 'deferred', label: 'Deferred' },
            ]}
          />
          <Select
            label="Reply"
            value={replyFilter}
            onChange={e => { setReplyFilter(e.target.value); setPage(1); }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'none', label: 'No Reply' },
              { value: 'human', label: 'Human Reply' },
              { value: 'automated', label: 'Automated' },
              { value: 'bounce', label: 'Bounce' },
            ]}
          />
          {hasActiveFilters && (
            <button onClick={() => { setQualFilter('all'); setOutreachFilter('all'); setReplyFilter('all'); setPage(1); }} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          rowIdKey="id"
          onRowClick={(row) => {
            const lead = allLeads.find(l => l.id === row.id);
            if (lead) setSelectedLead(lead);
          }}
          emptyState={<div className="text-center py-12"><Search size={28} className="text-muted mx-auto mb-2" /><p className="text-sm text-secondary">No leads match your filters</p></div>}
        />
        <div className="p-4 border-t border-white/10">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      {/* Lead Detail Drawer */}
      <Drawer
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.appName || 'Lead Details'}
        subtitle={selectedLead?.id}
        width="xl"
      >
        {selectedLead && (
          <div className="space-y-5">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selectedLead.qualificationStatus} size="md" />
              <StatusBadge status={selectedLead.outreachStatus} size="md" />
              <StatusBadge status={selectedLead.replyStatus} size="md" />
            </div>

            {/* App Info */}
            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><FileText size={13} /> App Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="App Name" value={selectedLead.appName} />
                <InfoField label="Category" value={selectedLead.category} />
                <InfoField label="Rating" value={`${selectedLead.rating} ★`} />
                <InfoField label="Installs" value={selectedLead.installCount.toLocaleString()} />
                <InfoField label="Country" value={selectedLead.country} />
                <InfoField label="Lead Score" value={`${selectedLead.leadScore}/100`} />
              </div>
            </div>

            {/* Developer Info */}
            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><Star size={13} /> Developer Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Developer" value={selectedLead.developer} />
                <InfoField label="Website" value={selectedLead.website || 'Not available'} />
              </div>
            </div>

            {/* Contact Info */}
            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><Mail size={13} /> Contact Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Email" value={selectedLead.email || 'Not available'} />
                <div>
                  <p className="text-[10px] text-muted uppercase mb-1">Email Validity</p>
                  <StatusBadge status={selectedLead.emailValidity} />
                </div>
              </div>
            </div>

            {/* Discovery Info */}
            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><Search size={13} /> Discovery Source</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Keyword" value={selectedLead.keyword} />
                <InfoField label="Search Query" value={selectedLead.searchQuery} />
                <InfoField label="Created" value={new Date(selectedLead.createdAt).toLocaleString()} />
                <InfoField label="Last Activity" value={new Date(selectedLead.lastActivity).toLocaleString()} />
              </div>
            </div>

            {/* Tags & Notes */}
            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><TagIcon size={13} /> Tags & Notes</h4>
              <div className="mb-3">
                <p className="text-[10px] text-muted uppercase mb-1.5">Tags</p>
                {selectedLead.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">{selectedLead.tags.map(t => <span key={t} className="px-2 py-1 rounded-md bg-accent-500/10 text-accent-300 text-xs border border-accent-500/20">{t}</span>)}</div>
                ) : <span className="text-xs text-muted">No tags</span>}
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase mb-1.5">Notes</p>
                {selectedLead.notes.length > 0 ? (
                  <div className="space-y-1.5">{selectedLead.notes.map((n, i) => <p key={i} className="text-xs text-secondary p-2 rounded-md bg-white/5">{n}</p>)}</div>
                ) : <span className="text-xs text-muted">No notes</span>}
              </div>
            </div>

            {/* Timeline */}
            <div className="card-base p-4">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><History size={13} /> Activity Timeline</h4>
              <div className="space-y-3">
                <TimelineItem time={selectedLead.createdAt} event="Lead discovered" status="success" />
                <TimelineItem time={selectedLead.createdAt} event="Lead qualified — meets all criteria" status="success" />
                {selectedLead.outreachStatus !== 'none' && <TimelineItem time={selectedLead.lastActivity} event={`Outreach: ${selectedLead.outreachStatus}`} status="info" />}
                {selectedLead.replyStatus !== 'none' && <TimelineItem time={selectedLead.lastActivity} event={`Reply received: ${selectedLead.replyStatus}`} status="info" />}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted uppercase mb-1">{label}</p>
      <p className="text-sm text-primary">{value}</p>
    </div>
  );
}

function TimelineItem({ time, event, status }: { time: string; event: string; status: string }) {
  const colorMap: Record<string, string> = { success: 'bg-success-500', info: 'bg-accent-500', warning: 'bg-warning-500', error: 'bg-error-500' };
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <span className={`w-2 h-2 rounded-full ${colorMap[status] || 'bg-accent-500'} mt-1.5`} />
        <span className="w-px h-full bg-white/10" />
      </div>
      <div className="pb-1">
        <p className="text-xs text-primary">{event}</p>
        <p className="text-[10px] text-muted">{new Date(time).toLocaleString()}</p>
      </div>
    </div>
  );
}

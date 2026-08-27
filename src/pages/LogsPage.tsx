import { useState } from 'react';
import { Search, Filter, Download, ScrollText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/DataTable';
import { useToast } from '@/contexts/ToastContext';
import { activityLogs } from '@/data/mockData';

const PAGE_SIZE = 12;

export function LogsPage() {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = activityLogs.filter(log => {
    if (search && !log.event.toLowerCase().includes(search.toLowerCase()) && !log.details.toLowerCase().includes(search.toLowerCase()) && !log.source.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageLogs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Activity Logs</h2>
          <p className="text-xs text-muted mt-0.5">{filtered.length} events · Full audit trail</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => addToast('success', 'Export complete', `${filtered.length} log entries exported.`)}>
          Export Logs
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input placeholder="Search events, details, or source..." icon={<Search size={15} />} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'success', label: 'Success' },
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' },
            ]}
          />
        </div>
      </div>

      {/* Log Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-5 text-left text-[10px] font-semibold text-muted uppercase">Timestamp</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Event</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Source</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Status</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              {pageLogs.map(log => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-5 text-xs text-muted font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-3 text-sm text-primary font-medium whitespace-nowrap">{log.event}</td>
                  <td className="py-3 px-3 text-xs text-secondary whitespace-nowrap">{log.source}</td>
                  <td className="py-3 px-3"><StatusBadge status={log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : log.status === 'warning' ? 'warning' : 'info'} showDot={false} /></td>
                  <td className="py-3 px-3 text-xs text-secondary max-w-md truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageLogs.length === 0 && (
          <div className="py-12 text-center">
            <ScrollText size={28} className="text-muted mx-auto mb-2" />
            <p className="text-sm text-secondary">No log entries match your filters</p>
          </div>
        )}
        <div className="p-4 border-t border-white/10">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}

import {
  LayoutDashboard, Zap, Tags, Search, Users, Mail, MessageSquare,
  BarChart3, Plug, Settings, ScrollText, Activity,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useNav, type PageId } from '@/contexts/NavContext';
import { currentJob } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'keywords', label: 'Keywords', icon: Tags },
  { id: 'lead-generation', label: 'Lead Generation', icon: Search },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'outreach', label: 'Outreach', icon: Mail },
  { id: 'replies', label: 'Replies', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'logs', label: 'Activity Logs', icon: ScrollText },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { currentPage, navigate } = useNav();

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onMobileClose} />}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-60 flex-shrink-0 z-50 lg:z-0
        glass border-r border-white/10 flex flex-col
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center glow-accent">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary tracking-tight">LeadForge AI</h1>
            <p className="text-[10px] text-muted">Automation Control</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 no-scrollbar">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider px-2.5 mb-2">Navigation</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.id); onMobileClose(); }}
                className={`
                  w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium mb-0.5
                  transition-all duration-200
                  ${active ? 'bg-accent-500/10 text-accent-300' : 'text-secondary hover:bg-white/5 hover:text-primary'}
                `}
              >
                <Icon size={17} className={active ? 'text-accent-400' : ''} />
                {item.label}
                {active && <span className="ml-auto w-1 h-5 bg-accent-500 rounded-full" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <div className="card-base p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted uppercase tracking-wider">System Status</span>
              <StatusBadge status="online" size="sm" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-secondary">Current Job</span>
            </div>
            <p className="text-xs text-primary font-medium truncate">{currentJob.keyword}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent-500 rounded-full" style={{ width: `${(currentJob.progress.current / currentJob.progress.target) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted tabular-nums">{Math.round((currentJob.progress.current / currentJob.progress.target) * 100)}%</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

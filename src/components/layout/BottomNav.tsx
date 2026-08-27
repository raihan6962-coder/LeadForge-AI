import {
  LayoutDashboard, Zap, Tags, Search, Users, Mail, MessageSquare,
  BarChart3, Plug, Settings, ScrollText,
} from 'lucide-react';
import { useNav, type PageId } from '@/contexts/NavContext';

const items: { id: PageId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'automation', icon: Zap, label: 'Automation' },
  { id: 'keywords', icon: Tags, label: 'Keywords' },
  { id: 'lead-generation', icon: Search, label: 'Discovery' },
  { id: 'leads', icon: Users, label: 'Leads' },
  { id: 'outreach', icon: Mail, label: 'Outreach' },
  { id: 'replies', icon: MessageSquare, label: 'Replies' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'integrations', icon: Plug, label: 'Integrations' },
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'logs', icon: ScrollText, label: 'Logs' },
];

export function BottomNav() {
  const { currentPage, navigate } = useNav();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-strong border-t border-white/10 px-1 py-1">
      <div className="flex items-center justify-around overflow-x-auto no-scrollbar">
        {items.map(item => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                active ? 'text-accent-400' : 'text-muted'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

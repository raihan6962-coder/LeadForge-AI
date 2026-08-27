import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, LogOut, ChevronDown, Check, AlertTriangle, Info, XCircle, CheckCircle2, Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNav } from '@/contexts/NavContext';
import { notifications as initialNotifications } from '@/data/mockData';
import type { AppNotification, NotificationType } from '@/types';

const pageTitles: Record<string, string> = {
  overview: 'Overview',
  automation: 'Automation Control Center',
  keywords: 'Keyword Management',
  'lead-generation': 'Lead Generation',
  leads: 'Lead Database',
  outreach: 'Outreach Center',
  replies: 'Reply Center',
  analytics: 'Analytics',
  integrations: 'Integrations',
  settings: 'Settings',
  logs: 'Activity Logs',
};

const notifIcon: Record<NotificationType, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const notifColor: Record<NotificationType, string> = {
  success: 'text-success-400',
  info: 'text-accent-400',
  warning: 'text-warning-400',
  error: 'text-error-400',
};

interface TopBarProps {
  onMobileMenu: () => void;
}

export function TopBar({ onMobileMenu }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { currentPage } = useNav();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifList, setNotifList] = useState<AppNotification[]>(initialNotifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unackCount = notifList.filter(n => !n.acknowledged).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const acknowledge = (id: string) => {
    setNotifList(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true } : n));
  };

  const acknowledgeAll = () => {
    setNotifList(prev => prev.map(n => ({ ...n, acknowledged: true })));
  };

  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-white/10 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenu} className="lg:hidden text-secondary hover:text-primary p-1">
          <Menu size={20} />
        </button>
        <h2 className="text-base font-semibold text-primary hidden sm:block">{pageTitles[currentPage] || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <div className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-48 lg:w-64 rounded-lg bg-white/5 border border-white/10 text-sm text-primary placeholder:text-muted pl-9 pr-3 py-1.5 focus:outline-none focus:border-accent-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        <button onClick={toggleTheme} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-colors">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-colors"
          >
            <Bell size={18} />
            {unackCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unackCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-strong rounded-xl shadow-2xl border border-white/10 animate-slide-up overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <span className="text-sm font-semibold text-primary">Notifications</span>
                {unackCount > 0 && (
                  <button onClick={acknowledgeAll} className="text-xs text-accent-400 hover:text-accent-300 font-medium flex items-center gap-1">
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifList.map(n => {
                  const Icon = notifIcon[n.type];
                  return (
                    <div
                      key={n.id}
                      onClick={() => acknowledge(n.id)}
                      className={`flex items-start gap-3 p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.acknowledged ? 'bg-accent-500/5' : ''}`}
                    >
                      <Icon size={16} className={`flex-shrink-0 mt-0.5 ${notifColor[n.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-primary">{n.title}</p>
                        <p className="text-xs text-secondary mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                      </div>
                      {!n.acknowledged && <span className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'AM'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-primary">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-muted">{user?.role || 'Administrator'}</p>
            </div>
            <ChevronDown size={14} className="text-muted hidden sm:block" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl shadow-2xl border border-white/10 animate-slide-up overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <p className="text-sm font-medium text-primary">{user?.name}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-error-400 hover:bg-error-500/10 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

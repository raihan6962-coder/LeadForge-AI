import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`card-base ${hover ? 'transition-all duration-200 hover:border-white/20 hover:shadow-lg cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between p-5 pb-3 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'accent' | 'success' | 'warning' | 'error';
}

export function KPICard({ label, value, icon, change, trend = 'neutral', color = 'accent' }: KPICardProps) {
  const colorClasses = {
    accent: 'text-accent-400 bg-accent-500/10',
    success: 'text-success-400 bg-success-500/10',
    warning: 'text-warning-400 bg-warning-500/10',
    error: 'text-error-400 bg-error-500/10',
  };

  const trendColor = trend === 'up' ? 'text-success-400' : trend === 'down' ? 'text-error-400' : 'text-muted';

  return (
    <Card className="p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-secondary font-medium">{label}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-primary tabular-nums">{value}</span>
        {change && (
          <span className={`text-xs font-medium ${trendColor} flex items-center gap-0.5`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {change}
          </span>
        )}
      </div>
    </Card>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  color?: 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, max, label, showValue = true, color = 'accent', size = 'md' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClass = {
    accent: 'bg-accent-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };
  const heightClass = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-secondary">{label}</span>
          {showValue && <span className="text-xs text-muted tabular-nums">{value.toLocaleString()} / {max.toLocaleString()}</span>}
        </div>
      )}
      <div className={`w-full ${heightClass[size]} bg-white/5 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colorClass[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon && <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-muted mb-4">{icon}</div>}
      <h3 className="text-sm font-semibold text-primary mb-1">{title}</h3>
      {message && <p className="text-xs text-muted max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-error-500/10 flex items-center justify-center text-error-400 mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-primary mb-1">{title}</h3>
      {message && <p className="text-xs text-muted max-w-sm">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-xs text-accent-400 hover:text-accent-300 font-medium">
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

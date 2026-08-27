import { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
}

export function Input({ label, icon, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg bg-white/5 border border-white/10 text-primary text-sm placeholder:text-muted px-3.5 py-2 transition-all focus:outline-none focus:border-accent-500/50 focus:bg-white/10 ${icon ? 'pl-10' : ''} ${error ? 'border-error-500/50' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-secondary mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-lg bg-white/5 border border-white/10 text-primary text-sm px-3.5 py-2 transition-all focus:outline-none focus:border-accent-500/50 focus:bg-white/10 appearance-none cursor-pointer ${error ? 'border-error-500/50' : ''} ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#1a2535] text-primary">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-error-400">{error}</p>}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, size = 'md' }: ToggleProps) {
  const w = size === 'sm' ? 'w-9' : 'w-11';
  const h = size === 'sm' ? 'h-5' : 'h-6';
  const knob = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const translate = size === 'sm' ? (checked ? 'translate-x-4' : 'translate-x-0.5') : (checked ? 'translate-x-5' : 'translate-x-0.5');

  return (
    <div className="inline-flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative ${w} ${h} rounded-full transition-colors duration-200 ${checked ? 'bg-accent-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-1/2 -translate-y-1/2 ${knob} bg-white rounded-full shadow-sm transition-transform duration-200 ${translate}`} />
      </button>
      {label && <span className="text-sm text-secondary">{label}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-secondary mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full rounded-lg bg-white/5 border border-white/10 text-primary text-sm placeholder:text-muted px-3.5 py-2 transition-all focus:outline-none focus:border-accent-500/50 focus:bg-white/10 resize-y min-h-[100px] ${error ? 'border-error-500/50' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error-400">{error}</p>}
    </div>
  );
}

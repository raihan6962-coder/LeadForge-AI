import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent-500 hover:bg-accent-600 text-white border-transparent',
  secondary: 'bg-white/5 hover:bg-white/10 text-primary border-white/10',
  ghost: 'bg-transparent hover:bg-white/5 text-secondary border-transparent',
  danger: 'bg-error-500 hover:bg-error-600 text-white border-transparent',
  success: 'bg-success-500 hover:bg-success-600 text-white border-transparent',
  outline: 'bg-transparent hover:bg-white/5 text-primary border-white/15',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

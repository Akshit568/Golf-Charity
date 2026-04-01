// src/components/ui/index.tsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center font-body font-medium tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'px-4 py-2 text-sm rounded-md gap-1.5',
        size === 'md' && 'px-6 py-3 text-sm rounded-lg gap-2',
        size === 'lg' && 'px-8 py-4 text-base rounded-xl gap-2.5',
        variant === 'primary' && 'bg-brand-gold text-brand-dark hover:bg-amber-400 active:scale-[0.98]',
        variant === 'secondary' && 'bg-brand-green text-brand-cream border border-brand-sage hover:bg-brand-sage active:scale-[0.98]',
        variant === 'ghost' && 'text-brand-cream hover:bg-white/5 border border-white/10 hover:border-white/20',
        variant === 'danger' && 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
        className
      )}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      )}
      <span className={cn('flex items-center gap-2', loading && 'invisible')}>
        {children}
      </span>
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'gold' | 'red' | 'muted';
  className?: string;
}
export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider uppercase',
      variant === 'green' && 'bg-brand-green/40 text-green-300 border border-brand-sage/40',
      variant === 'gold'  && 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      variant === 'red'   && 'bg-red-500/20 text-red-300 border border-red-500/30',
      variant === 'muted' && 'bg-white/5 text-brand-muted border border-white/10',
      className
    )}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false }: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm',
      hover && 'transition-all duration-300 hover:border-brand-sage/50 hover:bg-white/[0.05]',
      className
    )}>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-brand-warm/80">
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-brand-cream placeholder:text-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold/50 transition-all duration-200',
          error && 'border-red-500/50 focus:ring-red-500/30',
          className
        )}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon }: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono text-brand-muted uppercase tracking-widest">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-brand-gold opacity-60" />}
      </div>
      <div className="font-display text-3xl font-light text-brand-cream">{value}</div>
      {sub && <div className="text-xs text-brand-muted mt-1">{sub}</div>}
    </Card>
  );
}

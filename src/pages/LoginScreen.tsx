import { useState } from 'react';
import { Activity, Lock, Mail, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired] = useState(() => new URLSearchParams(window.location.search).get('reason') === 'expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14] via-[#0f1620] to-[#0a0e14]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent-600/5 rounded-full blur-[100px] translate-y-1/2" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="glass-strong rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center glow-accent mb-4">
              <Activity size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-primary">LeadForge AI</h1>
            <p className="text-xs text-muted mt-1">Private Admin Control Center</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 mb-5 rounded-lg bg-warning-500/10 border border-warning-500/20">
            <Shield size={14} className="text-warning-400 flex-shrink-0" />
            <p className="text-[11px] text-warning-400">Restricted access. Authorized personnel only.</p>
          </div>

          {sessionExpired && (
            <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-error-500/10 border border-error-500/20">
              <AlertCircle size={14} className="text-error-400 flex-shrink-0" />
              <p className="text-[11px] text-error-400">Your session has expired. Please sign in again.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-error-500/10 border border-error-500/20 animate-fade-in">
              <AlertCircle size={14} className="text-error-400 flex-shrink-0" />
              <p className="text-[11px] text-error-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@leadforge.ai"
              icon={<Mail size={15} />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              icon={<Lock size={15} />}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
              icon={!loading ? <ArrowRight size={16} /> : undefined}
            >
              {loading ? 'Authenticating...' : 'Sign In to Control Center'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[10px] text-muted text-center leading-relaxed">
              Credentials are transmitted securely and never stored in client-side code.<br />
              All access is logged and monitored.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted mt-4">
          LeadForge AI v2.4.0 — Automation Control Platform
        </p>
      </div>
    </div>
  );
}

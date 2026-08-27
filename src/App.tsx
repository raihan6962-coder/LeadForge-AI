import { useState, Component, type ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NavProvider } from '@/contexts/NavContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LoginScreen } from '@/pages/LoginScreen';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastContainer } from '@/components/ui/Toast';
import { OverviewPage } from '@/pages/OverviewPage';
import { AutomationPage } from '@/pages/AutomationPage';
import { KeywordsPage } from '@/pages/KeywordsPage';
import { LeadGenerationPage } from '@/pages/LeadGenerationPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { OutreachPage } from '@/pages/OutreachPage';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { RepliesPage } from '@/pages/RepliesPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { LogsPage } from '@/pages/LogsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useNav } from '@/contexts/NavContext';

class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-app">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-error-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠</span>
            </div>
            <h2 className="text-lg font-bold text-primary mb-2">Something went wrong</h2>
            <p className="text-sm text-secondary mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-4 py-2 rounded-lg bg-accent-500/10 border border-accent-500/20 text-sm text-accent-300 hover:bg-accent-500/20 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-app">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-xl">⚡</span>
        </div>
        <p className="text-sm text-muted">Loading LeadForge AI...</p>
      </div>
    </div>
  );
}

function PageRouter() {
  const { currentPage } = useNav();

  switch (currentPage) {
    case 'overview': return <OverviewPage />;
    case 'automation': return <AutomationPage />;
    case 'keywords': return <KeywordsPage />;
    case 'lead-generation': return <LeadGenerationPage />;
    case 'leads': return <LeadsPage />;
    case 'outreach': return <OutreachPage />;
    case 'replies': return <RepliesPage />;
    case 'analytics': return <AnalyticsPage />;
    case 'integrations': return <IntegrationsPage />;
    case 'settings': return <SettingsPage />;
    case 'logs': return <LogsPage />;
    default: return <OverviewPage />;
  }
}

function AppShell() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginScreen />;

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-[1600px] w-full mx-auto">
          <PageRouter />
        </main>
      </div>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NavProvider>
              <AppShell />
            </NavProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

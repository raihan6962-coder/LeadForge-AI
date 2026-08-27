import { createContext, useContext, useState, type ReactNode } from 'react';

export type PageId =
  | 'overview' | 'automation' | 'keywords' | 'lead-generation' | 'leads'
  | 'outreach' | 'replies' | 'analytics' | 'integrations' | 'settings' | 'logs';

interface NavContextValue {
  currentPage: PageId;
  navigate: (page: PageId) => void;
}

const NavContext = createContext<NavContextValue | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');

  const navigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return <NavContext.Provider value={{ currentPage, navigate }}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}

import React, { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ReportItemPage } from './pages/ReportItemPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import type { ItemType } from './types/portal';

function parseHashRoute(): { pathname: string; params: URLSearchParams } {
  const rawHash = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = rawHash.split('?');
  const pathname = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return {
    pathname,
    params: new URLSearchParams(queryPart || ''),
  };
}

function PortalRouter() {
  const [route, setRoute] = useState(() => parseHashRoute());

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHashRoute());
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((target: string) => {
    const normalized = target.startsWith('/') ? target : `/${target}`;
    if (`#${normalized}` === window.location.hash) {
      setRoute(parseHashRoute());
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    window.location.hash = normalized;
  }, []);

  const { pathname, params } = route;

  let content: React.ReactNode;
  if (pathname === '/' || pathname === '') {
    content = <HomePage onNavigate={navigate} />;
  } else if (pathname === '/browse') {
    content = <BrowsePage initialSearch={params.get('search') || ''} onNavigate={navigate} />;
  } else if (pathname.startsWith('/item/')) {
    const itemId = pathname.slice('/item/'.length);
    content = <ItemDetailPage itemId={itemId} onNavigate={navigate} />;
  } else if (pathname === '/report') {
    const t = params.get('type') === 'found' ? ('found' as ItemType) : ('lost' as ItemType);
    content = <ReportItemPage initialType={t} onNavigate={navigate} />;
  } else if (pathname === '/login') {
    content = <LoginPage redirectPath={params.get('redirect') || undefined} onNavigate={navigate} />;
  } else if (pathname === '/register') {
    content = <RegisterPage onNavigate={navigate} />;
  } else if (pathname === '/dashboard') {
    content = <DashboardPage onNavigate={navigate} />;
  } else {
    content = <HomePage onNavigate={navigate} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#14213D]">
      <Navbar currentPath={pathname} onNavigate={navigate} />
      <div className="flex-1">{content}</div>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <PortalRouter />
      </ToastProvider>
    </AuthProvider>
  );
}

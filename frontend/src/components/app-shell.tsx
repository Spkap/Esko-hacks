'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  SquaresFourIcon as LayoutDashboard,
  SidebarSimpleIcon as PanelLeft,
  CaretRightIcon as ChevronRight,
  ArrowCounterClockwiseIcon as RotateCcw,
  FlaskIcon as FlaskConical,
  ArrowUpRightIcon as ArrowUpRight,
  ShieldCheckIcon as ShieldCheck,
  FilePlusIcon as FilePlus2,
  GlobeHemisphereWestIcon as Globe2,
} from '@phosphor-icons/react/ssr';
import { Button } from './ui/button';
import { Modal } from './modal';
import { Brand } from './brand';
import { repository, dataMode } from '@/data/repository';
import './workspace.css';
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [nav, setNav] = useState(false);
  const [reset, setReset] = useState(false);
  const [message, setMessage] = useState('');
  const navigation = (
    <nav aria-label="Main navigation">
      <Link
        href="/dashboard"
        className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
        aria-current={pathname === '/dashboard' ? 'page' : undefined}
        onClick={() => setNav(false)}
      >
        <LayoutDashboard weight="duotone" aria-hidden="true" size={18} />
        Packaging reviews
      </Link>
      <Link
        href="/checks/mori-strawberry"
        aria-current={pathname.startsWith('/checks/mori-') ? 'page' : undefined}
        className={`nav-link ${pathname.startsWith('/checks/mori-') ? 'active' : ''}`}
        onClick={() => setNav(false)}
      >
        <ShieldCheck weight="duotone" aria-hidden="true" size={18} />
        Sample artwork
        <ArrowUpRight aria-hidden="true" size={14} />
      </Link>
      <Link
        href="/checks/new"
        aria-current={pathname === '/checks/new' ? 'page' : undefined}
        className={`nav-link ${pathname === '/checks/new' ? 'active' : ''}`}
        onClick={() => setNav(false)}
      >
        <FilePlus2 weight="duotone" aria-hidden="true" size={18} />
        New check
      </Link>
      <Link href="/" className="nav-link" onClick={() => setNav(false)}>
        <Globe2 weight="duotone" aria-hidden="true" size={18} />
        About Wavelength
        <ArrowUpRight aria-hidden="true" size={14} />
      </Link>
    </nav>
  );
  if (pathname === '/') return <>{children}</>;
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label eyebrow">Workspace</div>
        {navigation}
        <div className="sidebar-bottom">
          <Button variant="ghost" onClick={() => setReset(true)}>
            <RotateCcw aria-hidden="true" size={16} />
            Reset demo decisions
          </Button>
          <div className="demo-note">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Built for careful review
            </div>
            <p className="small muted">Artwork, evidence, and the next step. In one place.</p>
          </div>
        </div>
      </aside>
      <header className="topbar">
        <div className="mobile-brand">
          <Brand />
          <span className="workspace-mobile-mode">
            {dataMode === 'demo' ? 'Demo data · Review workspace' : 'Live mode · Review workspace'}
          </span>
        </div>
        <div className="topbar-breadcrumb">
          <LayoutDashboard weight="duotone" aria-hidden="true" size={15} />
          <Link href="/dashboard">Workspace</Link>
          <ChevronRight aria-hidden="true" size={13} />
          <span>
            {pathname === '/checks/new'
              ? 'New check'
              : pathname.includes('/report')
                ? 'Review report'
                : pathname.startsWith('/checks/')
                  ? 'Artwork review'
                  : 'Packaging reviews'}
          </span>
        </div>
        <div className="topbar-meta">
          <span className="demo-label">
            <FlaskConical weight="duotone" aria-hidden="true" size={13} />
            {dataMode === 'demo' ? 'Demo data' : 'Live mode'}
          </span>
          <span className="reviewer-name muted">Demo reviewer</span>
          <span className="avatar" aria-hidden="true">
            DR
          </span>
          <Button
            className="menu-button"
            variant="outline"
            size="icon"
            aria-label="Open navigation"
            onClick={() => setNav(true)}
          >
            <PanelLeft aria-hidden="true" size={18} />
          </Button>
        </div>
      </header>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
        <footer className="page-footer">
          <span>WAVELENGTH / PACKAGING REVIEW WORKSPACE</span>
          <span>Frontend prototype · Demo workspace</span>
        </footer>
      </main>
      <div role="status" className="sr-only">
        {message}
      </div>
      {nav && (
        <Modal title="Workspace navigation" variant="drawer" onClose={() => setNav(false)}>
          {navigation}
          <Button
            variant="ghost"
            onClick={() => {
              setNav(false);
              setReset(true);
            }}
          >
            <RotateCcw aria-hidden="true" size={16} />
            Reset demo decisions
          </Button>
        </Modal>
      )}
      {reset && (
        <Modal title="Reset demo decisions?" onClose={() => setReset(false)}>
          <p>
            This clears your acknowledgements and dismissal reasons. The original sample assessments
            stay the same.
          </p>
          <div className="button-row">
            <Button
              onClick={async () => {
                try {
                  await repository.reset();
                  setReset(false);
                  setMessage('Demo decisions reset.');
                  router.refresh();
                  window.dispatchEvent(new Event('wavelength-reset'));
                } catch (e) {
                  setMessage((e as Error).message);
                  setReset(false);
                }
              }}
            >
              Reset decisions
            </Button>
            <Button variant="outline" onClick={() => setReset(false)}>
              Keep decisions
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

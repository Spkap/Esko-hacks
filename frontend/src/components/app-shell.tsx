'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Check,
  LayoutDashboard,
  PanelLeft,
  ChevronRight,
  RotateCcw,
  FlaskConical,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from './ui/button';
import { Modal } from './modal';
import { repository, dataMode } from '@/data/repository';
export function Brand() {
  return (
    <Link href="/dashboard" className="brand" aria-label="Veriforge dashboard">
      <span className="brand-mark">
        <Check size={20} strokeWidth={3} />
      </span>
      veriforge<span style={{ color: 'var(--brand)' }}>.</span>
    </Link>
  );
}
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
        onClick={() => setNav(false)}
      >
        <LayoutDashboard size={18} />
        Packaging reviews
      </Link>
      <Link
        href="/checks/mori-strawberry"
        className={`nav-link ${pathname.startsWith('/checks/') ? 'active' : ''}`}
        onClick={() => setNav(false)}
      >
        <ShieldCheck size={18} />
        Sample artwork
        <ArrowUpRight size={14} />
      </Link>
    </nav>
  );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label eyebrow">Review workspace</div>
        {navigation}
        <div className="sidebar-bottom">
          <Button variant="ghost" onClick={() => setReset(true)}>
            <RotateCcw size={16} />
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
        </div>
        <div className="topbar-breadcrumb">
          <LayoutDashboard size={15} />
          <Link href="/dashboard">Workspace</Link>
          <ChevronRight size={13} />
          <span>
            {pathname.includes('/report')
              ? 'Review report'
              : pathname.startsWith('/checks/')
                ? 'Artwork review'
                : 'Packaging reviews'}
          </span>
        </div>
        <div className="topbar-meta">
          <span className="demo-label">
            <FlaskConical size={13} />
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
            <PanelLeft size={18} />
          </Button>
        </div>
      </header>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
        <footer className="page-footer">
          <span>VERIFORGE / PACKAGING REVIEW WORKSPACE</span>
          <span>Frontend prototype · M1–M2</span>
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
            <RotateCcw size={16} />
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
                  window.dispatchEvent(new Event('veriforge-reset'));
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

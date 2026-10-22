'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ListIcon as Menu, ArrowUpRightIcon as ArrowUpRight } from '@phosphor-icons/react/ssr';
import { Button } from '../ui/button';
import { Modal } from '../modal';
import { Brand } from '../brand';
// Navigation structure adapted from Watermelon hero-1; native modal replaces its overlay.
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const links = (
    <>
      <a href="#how-it-works" onClick={() => setOpen(false)}>
        How it works
      </a>
      <a href="#demo-scope" onClick={() => setOpen(false)}>
        Demo scope
      </a>
      <Link href="/dashboard" onClick={() => setOpen(false)}>
        Workspace
        <ArrowUpRight aria-hidden="true" size={14} />
      </Link>
    </>
  );
  return (
    <header className="landing-nav landing-container">
      <Brand href="/" label="Wavelength home" />
      <nav className="landing-desktop-nav" aria-label="Main navigation">
        {links}
      </nav>
      <div className="landing-nav-actions">
        <Button asChild variant="outline">
          <Link href="/checks/new">
            New check
            <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        </Button>
        <Button
          className="landing-menu"
          variant="outline"
          size="icon"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu aria-hidden="true" size={19} />
        </Button>
      </div>
      {open && (
        <Modal title="Explore Wavelength" variant="drawer" onClose={() => setOpen(false)}>
          <nav className="landing-drawer-links" aria-label="Mobile navigation">
            {links}
            <Link href="/checks/mori-strawberry" onClick={() => setOpen(false)}>
              Try sample check
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </nav>
        </Modal>
      )}
    </header>
  );
}

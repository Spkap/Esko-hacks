import Link from 'next/link';
import { Brand } from '../brand';
import { ArrowUpRightIcon as ArrowUpRight } from '@phosphor-icons/react/ssr';
// Brand / grouped links / divided closing line adapted from Watermelon footer-1.
export function LandingFooter() {
  return (
    <footer className="landing-footer landing-container">
      <div className="landing-footer-main">
        <div>
          <Brand href="/" label="Wavelength home" />
          <p>Clarity before the shelf.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/dashboard">
            Review workspace
            <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
          <Link href="/checks/new">
            New check
            <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
          <Link href="/checks/mori-strawberry">
            Sample review
            <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        </nav>
      </div>
      <span className="wl-footer-display" aria-hidden="true">
        Wavelength
      </span>
      <div className="landing-footer-bottom">
        <span>© 2026 Wavelength · Hackathon prototype</span>
        <span>Limited checks. Traceable evidence. Human review.</span>
      </div>
    </footer>
  );
}

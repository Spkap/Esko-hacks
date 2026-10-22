import Link from 'next/link';
import { Check, ArrowUpRight } from 'lucide-react';
// Brand / grouped links / divided closing line adapted from Watermelon footer-1.
export function LandingFooter() {
  return (
    <footer className="landing-footer landing-container">
      <div className="landing-footer-main">
        <div>
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Check size={20} strokeWidth={3} />
            </span>
            veriforge<span className="brand-period">.</span>
          </Link>
          <p>Clarity before the shelf.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/dashboard">
            Review workspace
            <ArrowUpRight size={15} />
          </Link>
          <Link href="/checks/new">
            New check
            <ArrowUpRight size={15} />
          </Link>
          <Link href="/checks/mori-strawberry">
            Sample review
            <ArrowUpRight size={15} />
          </Link>
        </nav>
      </div>
      <div className="landing-footer-bottom">
        <span>© 2026 Veriforge · Hackathon prototype</span>
        <span>Limited checks. Traceable evidence. Human review.</span>
      </div>
    </footer>
  );
}

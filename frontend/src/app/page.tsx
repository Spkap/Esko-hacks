import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, FileUp, ScanLine, ListChecks, Check, Minus } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { SamplePreview } from '@/components/landing/sample-preview';
import { Button } from '@/components/ui/button';
export const metadata: Metadata = {
  title: 'Veriforge · Clarity before the shelf',
  description:
    'Check your packaging before it reaches the shelf. Explore artwork, linked reference evidence, and suggested corrections in an interactive packaging review demo.',
};
// Hero composition adapted from Watermelon hero-1. Local product evidence replaces stock media.
export default function Home() {
  return (
    <div className="landing">
      <a href="#landing-main" className="skip-link">
        Skip to content
      </a>
      <LandingNav />
      <main id="landing-main">
        <section className="landing-hero landing-container">
          <div className="hero-eyebrow">
            <span className="hero-crosshair" aria-hidden="true" />
            <span>THE PACKAGING REVIEW DESK</span>
            <span className="hero-demo-tag">Interactive prototype</span>
          </div>
          <div className="hero-copy">
            <h1>
              Check your packaging
              <br className="hero-break" /> before it reaches
              <br className="hero-break" /> the shelf.
            </h1>
            <div className="hero-intro">
              <p>
                Bring artwork, requirements, and evidence into one clear review. Find what needs
                attention. Know what to fix next.
              </p>
              <Button asChild className="hero-cta">
                <Link href="/checks/mori-strawberry">
                  Try sample check
                  <ArrowUpRight size={19} />
                </Link>
              </Button>
              <span className="hero-caption">
                No sign-up · Fictional sample · Simulated findings
              </span>
            </div>
          </div>
          <div className="hero-preview-caption">
            <span>
              <span className="live-dot" />A closer look, before the final print.
            </span>
            <span>01 / EXPLORE THE SAMPLE BELOW</span>
          </div>
          <SamplePreview />
        </section>
        <section id="how-it-works" className="workflow-section landing-container">
          <div className="landing-section-head">
            <div className="eyebrow">FROM FILE TO FINDING</div>
            <h2>
              A clear path through
              <br />
              every packaging review.
            </h2>
            <p>
              Less jumping between documents.
              <br />
              More context for the next decision.
            </p>
          </div>
          <div className="workflow-steps">
            {[
              {
                number: '01',
                Icon: FileUp,
                title: 'Bring the artwork.',
                copy: 'Start with the packaging layout and product specification. Add company policies or regulatory references for context.',
              },
              {
                number: '02',
                Icon: ScanLine,
                title: 'Look closer.',
                copy: 'Choose the market and review scope. In the sample, each finding connects directly to the artwork and its reference.',
              },
              {
                number: '03',
                Icon: ListChecks,
                title: 'Move forward, informed.',
                copy: 'Inspect the evidence, review a suggested correction, and record a decision without changing the original assessment.',
              },
            ].map(({ number, Icon, title, copy }) => (
              <article key={number}>
                <div className="workflow-step-top">
                  <span>{number}</span>
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="demo-scope" className="scope-section">
          <div className="landing-container scope-layout">
            <div>
              <div className="eyebrow">DESIGNED FOR CAREFUL DECISIONS</div>
              <h2>
                Useful evidence.
                <br />
                An honest scope.
              </h2>
              <p>Good review starts with knowing what was checked—and what still needs a person.</p>
              <Link className="scope-link" href="/checks/mori-strawberry/report">
                See the sample report
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="scope-ledger">
              <div>
                <span className="scope-icon supported">
                  <Check size={19} />
                </span>
                <div>
                  <h3>Explore today</h3>
                  <p>
                    Japan fruit-beverage sample. Artwork inspection, an illustrative company
                    checklist, a product-data comparison, and an unresolved measurement.
                  </p>
                </div>
              </div>
              <div>
                <span className="scope-icon">
                  <FileUp size={19} />
                </span>
                <div>
                  <h3>Preview your files</h3>
                  <p>
                    PDF, PNG, and JPEG artwork with product references. Files remain in your browser
                    session; live analysis is not connected.
                  </p>
                </div>
              </div>
              <div>
                <span className="scope-icon">
                  <Minus size={19} />
                </span>
                <div>
                  <h3>A limited review, with a human in the loop</h3>
                  <p>
                    Simulated findings are not legal approval. Additional markets, authoritative
                    rule research, and live AI analysis are planned.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-closing landing-container">
          <div>
            <span className="eyebrow">YOUR NEXT REVIEW STARTS HERE</span>
            <h2>
              See the detail.
              <br />
              Make the next move.
            </h2>
          </div>
          <Button asChild>
            <Link href="/checks/mori-strawberry">
              Try sample check
              <ArrowUpRight size={18} />
            </Link>
          </Button>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

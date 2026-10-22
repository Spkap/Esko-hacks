import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownIcon as ArrowDown,
  ArrowRightIcon as ArrowRight,
  ArrowUpRightIcon as ArrowUpRight,
  FileArrowUpIcon as FileUp,
  ScanIcon as ScanLine,
  ListChecksIcon as ListChecks,
  CheckIcon as Check,
  MinusIcon as Minus,
  ArrowUpRightIcon as MoveUpRight,
  StackIcon as Layers,
  RecordIcon as CircleDot,
} from '@phosphor-icons/react/ssr';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { SamplePreview } from '@/components/landing/sample-preview';
import { ReportSnapshot } from '@/components/landing/report-snapshot';
import { Button } from '@/components/ui/button';
import '@/components/landing/landing.css';
export const metadata: Metadata = {
  title: 'Wavelength · Clarity before the shelf',
  description:
    'Check your packaging before it reaches the shelf. Explore artwork, linked reference evidence, and suggested corrections in an interactive packaging review demo.',
};
// Atmospheric hero / paired-action structure adapted from reviewed Watermelon hero-16 source.
export default function Home() {
  return (
    <div className="landing wl-page">
      <a href="#landing-main" className="skip-link">
        Skip to content
      </a>
      <LandingNav />
      <main id="landing-main">
        <section className="wl-hero landing-container" aria-labelledby="hero-title">
          <div className="wl-hero-copy">
            <div className="wl-kicker">
              <span className="wl-signal" />
              PACKAGING REVIEW, IN FOCUS
              <span className="wl-kicker-line" />
            </div>
            <h1 id="hero-title">
              <span>Check your </span>
              <span>packaging before </span>
              <span>it reaches the shelf.</span>
            </h1>
            <p className="wl-hero-description">
              Beautiful packaging deserves a closer look. Bring artwork, requirements, and evidence
              onto the same wavelength.
            </p>
            <div className="wl-hero-actions">
              <Button asChild className="wl-primary">
                <Link href="/checks/mori-strawberry">
                  Try sample check
                  <ArrowUpRight aria-hidden="true" size={18} />
                </Link>
              </Button>
              <a className="wl-text-link" href="#interactive-demo">
                Explore the review
                <ArrowDown aria-hidden="true" size={15} />
              </a>
            </div>
            <div className="wl-hero-disclosure">
              <span />
              No sign-up. Fictional sample. Simulated findings.
            </div>
          </div>
          <figure className="wl-hero-media">
            <Image
              className="wl-product-image"
              src="/brand/mori-studio.png"
              width={1536}
              height={1024}
              alt="Illustrative studio render of a MORI Strawberry beverage can with soft blue rim lighting"
              preload
              sizes="(max-width: 767px) 700px, 950px"
            />
            <div className="wl-product-coordinate wl-coordinate-top" aria-hidden="true">
              <span>+</span>ARTWORK / IN CONTEXT
            </div>
            <div className="wl-product-coordinate wl-coordinate-bottom" aria-hidden="true">
              <span>+</span>35° 40′ N / 139° 45′ E
            </div>
            <Link
              className="wl-review-callout"
              href="/checks/mori-strawberry?check=mori-strawberry-declaration"
            >
              <span className="wl-callout-label">
                <span />A DETAIL WORTH REVIEWING
                <MoveUpRight aria-hidden="true" size={13} />
              </span>
              <strong>
                What’s missing
                <br />
                from the label?
              </strong>
              <span className="wl-callout-bottom">
                Explore the sample finding
                <ArrowRight aria-hidden="true" size={15} />
              </span>
            </Link>
            <figcaption>
              Illustrative product render<span>Sample review uses the original flat artwork.</span>
            </figcaption>
          </figure>
          <div className="wl-hero-baseline">
            <span>
              <span className="wl-tiny-wave" aria-hidden="true">
                ∿
              </span>
              Clarity before the shelf.
            </span>
            <a href="#interactive-demo">
              SCROLL TO LOOK CLOSER
              <ArrowDown aria-hidden="true" size={13} />
            </a>
          </div>
        </section>
        <div className="wl-capability-strip">
          <div className="landing-container">
            <span>
              <Layers aria-hidden="true" size={17} />
              Artwork & specifications
            </span>
            <span>
              <CircleDot aria-hidden="true" size={17} />A defined review scope
            </span>
            <span>
              <ListChecks aria-hidden="true" size={17} />
              Evidence behind every finding
            </span>
            <span>
              <Check aria-hidden="true" size={17} />
              Human judgment, connected
            </span>
          </div>
        </div>
        <section className="wl-demo-section" id="interactive-demo">
          <div className="landing-container">
            <div className="wl-section-intro">
              <div>
                <span className="wl-section-index">01 / THE REVIEW DESK</span>
                <h2>
                  Look closer.
                  <br />
                  It’s all connected.
                </h2>
              </div>
              <div className="wl-section-copy">
                <p>
                  Select a finding. See where it appears, read the source, and follow the suggested
                  correction—all in one review.
                </p>
                <span className="wl-interactive-badge">
                  <span />
                  INTERACTIVE SAMPLE
                </span>
              </div>
            </div>
            <SamplePreview />
            <div className="wl-demo-footnote">
              <span>
                <ScanLine aria-hidden="true" size={15} />
                Select a finding. Follow the evidence. See the next step.
              </span>
              <Link href="/dashboard">
                Open review workspace
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="wl-process landing-container">
          <div className="wl-section-intro">
            <div>
              <span className="wl-section-index">02 / FROM FILE TO FINDING</span>
              <h2>
                From artwork
                <br />
                to a clear next step.
              </h2>
            </div>
            <p className="wl-process-intro">
              Three connected steps.
              <br />
              One place to keep the context.
            </p>
          </div>
          <div className="wl-process-grid">
            <article>
              <div className="wl-process-visual wl-file-visual" aria-hidden="true">
                <div className="wl-file-card wl-file-back">
                  <FileUp aria-hidden="true" size={21} />
                  <span>PRODUCT SPECIFICATION</span>
                  <i />
                  <i />
                  <i />
                </div>
                <div className="wl-file-card wl-file-front">
                  <ScanLine aria-hidden="true" size={21} />
                  <strong>MORI</strong>
                  <span>ARTWORK / V1</span>
                  <div className="wl-file-swatch" />
                </div>
                <span className="wl-visual-caption">01 — BRING THE CONTEXT</span>
              </div>
              <div className="wl-process-text">
                <span>01</span>
                <h3>Start with the artwork.</h3>
                <p>
                  Bring packaging and product specifications together. Add your company policies and
                  reference documents.
                </p>
                <Link className="wl-process-link" href="/checks/new">
                  Prepare your files
                  <ArrowUpRight aria-hidden="true" size={14} />
                </Link>
              </div>
            </article>
            <article>
              <div className="wl-process-visual wl-evidence-visual" aria-hidden="true">
                <div className="wl-evidence-line">
                  <span />
                  <i />
                  <i />
                </div>
                <div className="wl-evidence-node">
                  <span className="wl-node-dot" />
                  <div>
                    <small>SELECTED COMPARISON</small>
                    <strong>Declared net quantity</strong>
                    <span>
                      Artwork 250 mL <ArrowRight aria-hidden="true" size={12} />
                      Specification 250 mL
                    </span>
                  </div>
                  <Check aria-hidden="true" size={16} />
                </div>
                <div className="wl-evidence-line wl-evidence-line-bottom">
                  <span />
                  <i />
                  <i />
                </div>
                <span className="wl-visual-caption">02 — CONNECT THE DETAILS</span>
              </div>
              <div className="wl-process-text">
                <span>02</span>
                <h3>See what needs attention.</h3>
                <p>
                  In the sample, each selected check connects an observation to the artwork and the
                  reference behind it.
                </p>
                <Link className="wl-process-link" href="#interactive-demo">
                  Explore the checks
                  <ArrowUpRight aria-hidden="true" size={14} />
                </Link>
              </div>
            </article>
            <article>
              <div className="wl-process-visual wl-next-visual" aria-hidden="true">
                <div className="wl-next-card">
                  <span>
                    <span />
                    SUGGESTED NEXT STEP
                  </span>
                  <strong>
                    Clarity on
                    <br />
                    what comes next.
                  </strong>
                  <div>
                    <Check aria-hidden="true" size={14} />
                    Evidence reviewed
                    <ArrowUpRight aria-hidden="true" size={15} />
                  </div>
                </div>
                <span className="wl-visual-caption">03 — MOVE THE REVIEW FORWARD</span>
              </div>
              <div className="wl-process-text">
                <span>03</span>
                <h3>Make the next move.</h3>
                <p>
                  Review a suggested correction and record a decision. Keep the original assessment
                  and its context intact.
                </p>
                <Link className="wl-process-link" href="/checks/mori-strawberry/report">
                  See the handoff
                  <ArrowUpRight aria-hidden="true" size={14} />
                </Link>
              </div>
            </article>
          </div>
        </section>
        <section id="demo-scope" className="wl-scope">
          <div className="landing-container wl-scope-layout">
            <div className="wl-scope-intro">
              <span className="wl-section-index">03 / A CLEARER PERSPECTIVE</span>
              <h2>
                Confidence starts
                <br />
                with context.
              </h2>
              <p>A good review makes its boundaries as clear as its findings.</p>
              <Link href="/checks/mori-strawberry/report" className="wl-text-link">
                See the sample report
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <ReportSnapshot />
            <div className="wl-scope-list">
              <div>
                <span className="wl-scope-number">01</span>
                <div>
                  <h3>A focused sample</h3>
                  <p>
                    Japan fruit beverage. An illustrative checklist, a product-data comparison, and
                    a measurement that still needs review.
                  </p>
                </div>
                <ScanLine aria-hidden="true" size={20} />
              </div>
              <div>
                <span className="wl-scope-number">02</span>
                <div>
                  <h3>Room for your own artwork</h3>
                  <p>
                    Preview PDF, PNG, or JPEG files with product references. Live analysis is not
                    connected; your uploads stay preview-only.
                  </p>
                </div>
                <FileUp aria-hidden="true" size={20} />
              </div>
              <div>
                <span className="wl-scope-number">03</span>
                <div>
                  <h3>Judgment stays human</h3>
                  <p>
                    Sample findings are simulated, and selected checks are not legal approval.
                    Authoritative rules and more markets are planned.
                  </p>
                </div>
                <Minus aria-hidden="true" size={20} />
              </div>
            </div>
          </div>
        </section>
        <section className="wl-closing landing-container">
          <span className="wl-section-index">SEE IT FOR YOURSELF</span>
          <h2>
            The next detail
            <br />
            changes everything.
          </h2>
          <p>Take a closer look at the sample packaging review.</p>
          <Button asChild className="wl-primary">
            <Link href="/checks/mori-strawberry">
              Try sample check
              <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
          </Button>
          <div className="wl-closing-waves" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

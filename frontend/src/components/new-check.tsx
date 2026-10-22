'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  FileUp,
  FlaskConical,
  Info,
  RotateCcw,
} from 'lucide-react';
import { repository, dataMode } from '@/data/repository';
import type { ArtworkVersion, ReferenceDocument } from '@/domain/types';
import { Button } from './ui/button';
import { ArtworkViewer } from './artwork-viewer';

type Slot = 'artwork' | 'specification' | 'reference';
const slots: Slot[] = ['artwork', 'specification', 'reference'];
const titles = {
  artwork: 'Packaging artwork',
  specification: 'Product specification',
  reference: 'Additional reference (optional)',
};
const accepted = ['application/pdf', 'image/png', 'image/jpeg'];
const draftKey = 'veriforge-upload-draft-v1';
export function NewCheck() {
  const [name, setName] = useState('');
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ArtworkVersion>();
  const [reviewId, setReviewId] = useState('');
  const [restored, setRestored] = useState(false);
  const [role, setRole] = useState<ReferenceDocument['role']>('company_policy');
  const [approval, setApproval] = useState<ReferenceDocument['approvalStatus']>('unknown');
  const form = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const ownedUrls = useRef<string[]>([]);
  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (draft && typeof draft.name === 'string') {
        queueMicrotask(() => {
          setName(draft.name);
          setRestored(true);
        });
      }
    } catch {
      /* Storage is optional. */
    }
    return () => ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  function saveDraft(value: string) {
    setName(value);
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ name: value }));
    } catch {
      /* In memory remains usable. */
    }
  }
  function choose(slot: Slot, file?: File) {
    setPreview(undefined);
    ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
    ownedUrls.current = [];
    setFiles((previous) => ({ ...previous, [slot]: file }));
    const message =
      file && (!accepted.includes(file.type) || file.size > 20 * 1024 * 1024 || !file.size)
        ? 'Choose a non-empty PDF, PNG, or JPEG no larger than 20 MiB.'
        : '';
    setErrors((previous) => ({ ...previous, [slot]: message }));
  }
  function reset() {
    ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
    ownedUrls.current = [];
    form.current?.reset();
    setName('');
    setFiles({});
    setErrors({});
    setPreview(undefined);
    setReviewId('');
    setRestored(false);
    setRole('company_policy');
    setApproval('unknown');
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      /* Optional storage. */
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const next: Record<string, string> = {};
    if (!name.trim()) next.product = 'Enter a product name.';
    for (const slot of slots) {
      const file = files[slot];
      if (!file && slot !== 'reference')
        next[slot] =
          `Choose a ${slot === 'artwork' ? 'packaging artwork' : 'product specification'} file.`;
      if (file && (!accepted.includes(file.type) || file.size > 20 * 1024 * 1024 || !file.size))
        next[slot] = 'Choose a non-empty PDF, PNG, or JPEG no larger than 20 MiB.';
    }
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const review = await repository.createReview({
        productName: name.trim(),
        market: 'Japan',
        category: 'Fruit beverage',
      });
      const artwork = await repository.addArtwork(review.id, files.artwork!);
      ownedUrls.current.push(artwork.url);
      if (artwork.fileType === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const task = pdfjs.getDocument({ url: artwork.url, useSystemFonts: true });
        try {
          const document = await task.promise;
          const pages: ArtworkVersion['pages'] = [];
          for (let page = 1; page <= document.numPages; page++) {
            const pdfPage = await document.getPage(page);
            const viewport = pdfPage.getViewport({ scale: 1, rotation: 0 });
            pages.push({
              width: viewport.width,
              height: viewport.height,
              rotation: pdfPage.rotate as 0 | 90 | 180 | 270,
            });
          }
          artwork.pages = pages;
        } finally {
          await task.destroy();
        }
      }
      if (artwork.fileType !== 'application/pdf') {
        const image = new window.Image();
        image.src = artwork.url;
        await image.decode();
        artwork.pages = [{ width: image.naturalWidth, height: image.naturalHeight, rotation: 0 }];
      }
      const specification = await repository.addReference(
        review.id,
        files.specification!,
        'product_specification',
        'unknown',
      );
      ownedUrls.current.push(specification.url);
      if (files.reference) {
        const reference = await repository.addReference(review.id, files.reference, role, approval);
        ownedUrls.current.push(reference.url);
      }
      setReviewId(review.id);
      setPreview(artwork);
      requestAnimationFrame(() => document.getElementById('upload-preview')?.focus());
    } catch (error) {
      ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
      ownedUrls.current = [];
      setErrors({
        submit: error instanceof Error ? error.message : 'Preview could not be created. Try again.',
      });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Link href="/dashboard" className="back-link">
        <ArrowLeft size={14} />
        All reviews
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Set up your review</div>
          <h1>Start with the artwork.</h1>
          <p>Bring the packaging and the requirements together.</p>
        </div>
      </div>
      <div className="new-check-layout">
        <form ref={form} onSubmit={submit} noValidate className="panel check-form">
          <div className="form-section-heading">
            <span className="step-index">01</span>
            <div>
              <h2>Product & market</h2>
              <p className="small muted">Choose the product category and target market.</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="product">Product name</label>
            <input
              className="text-input"
              id="product"
              value={name}
              onChange={(e) => saveDraft(e.target.value)}
              placeholder="e.g. MORI Strawberry"
              maxLength={160}
              aria-required="true"
              aria-invalid={!!errors.product}
              aria-describedby={errors.product ? 'product-error' : undefined}
            />
            {errors.product && (
              <p id="product-error" className="form-error">
                {errors.product}
              </p>
            )}
          </div>
          <div className="form-two-col">
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" defaultValue="Fruit beverage">
                <option>Fruit beverage</option>
                <option disabled>Breakfast cereal — Planned</option>
                <option disabled>Other products — Planned</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="market">Target market</label>
              <select id="market" defaultValue="Japan">
                <option>Japan</option>
                <option disabled>United States — Planned</option>
                <option disabled>European Union — Planned</option>
              </select>
            </div>
          </div>
          <div className="form-section-heading">
            <span className="step-index">02</span>
            <div>
              <h2>Artwork & references</h2>
              <p className="small muted">PDF, PNG or JPEG · up to 20 MiB per file</p>
            </div>
          </div>
          {restored && (
            <p className="upload-notice" role="status">
              Product name restored. Re-select your files; they are not saved after reload.
            </p>
          )}
          {slots.map((slot) => (
            <div className="field file-field" key={slot}>
              <label htmlFor={slot}>
                <FileUp size={17} />
                {titles[slot]}
              </label>
              <input
                type="file"
                id={slot}
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => choose(slot, e.target.files?.[0])}
                aria-required={slot !== 'reference'}
                aria-invalid={!!errors[slot]}
                aria-describedby={`${slot}-note`}
              />
              <p id={`${slot}-note`} className={errors[slot] ? 'form-error' : 'small muted'}>
                {errors[slot] ||
                  (files[slot]
                    ? `${files[slot]!.name} · ${(files[slot]!.size / 1024).toFixed(1)} KiB · ready to preview`
                    : slot === 'specification'
                      ? 'Specification approval status is unknown.'
                      : slot === 'reference'
                        ? 'Add a company policy or regulatory reference.'
                        : 'A complete label or packaging layout works best.')}
              </p>
            </div>
          ))}
          {files.reference && (
            <div className="form-two-col">
              <div className="field">
                <label htmlFor="reference-role">Reference role</label>
                <select
                  id="reference-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                >
                  <option value="company_policy">Company policy</option>
                  <option value="regulatory_reference">Regulatory reference</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="reference-approval">Declared approval status</label>
                <select
                  id="reference-approval"
                  value={approval}
                  onChange={(e) => setApproval(e.target.value as typeof approval)}
                >
                  <option value="unknown">Unknown</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>
          )}
          {errors.submit && (
            <p role="alert" className="form-error">
              {errors.submit}
            </p>
          )}
          <div className="form-actions">
            <Button disabled={busy || !!preview} type="submit">
              <FileCheck2 size={17} />
              {busy ? 'Preparing preview…' : preview ? 'Preview ready' : 'Create file preview'}
            </Button>
            <Button variant="ghost" type="button" onClick={reset} disabled={busy}>
              <RotateCcw size={15} />
              Reset
            </Button>
          </div>
          <p className="small muted">
            Your files stay in this browser session. Live analysis is not connected.
          </p>
        </form>
        <aside className="upload-aside">
          <div className="sample-invite">
            <span className="eyebrow">
              <FlaskConical size={15} />
              No files? No problem.
            </span>
            <h2>Meet MORI Strawberry.</h2>
            <p>
              Explore a packaging review with a missing statement, a matching quantity, and a
              measurement that needs a human.
            </p>
            <Image
              className="sample-artwork-thumb"
              unoptimized
              src="/demo/mori-v1.svg"
              width={900}
              height={620}
              alt="MORI Strawberry sample packaging, front and back label"
            />
            <Button asChild>
              <Link href="/checks/mori-strawberry">
                Use sample
                <ArrowRight size={16} />
              </Link>
            </Button>
            <p className="small">Fictional artwork · simulated findings</p>
          </div>
          <div className="upload-boundary">
            <Info size={18} />
            <p>Uploads are preview-only. Explore the sample to see simulated findings.</p>
          </div>
          {dataMode !== 'demo' && (
            <p className="form-error">
              Live mode is not connected. File preview creation is unavailable.
            </p>
          )}
        </aside>
      </div>
      {preview && (
        <section id="upload-preview" tabIndex={-1} className="upload-result">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Preview only · no assessment</div>
              <h2>{name}</h2>
              <p className="small muted">No compliance checks have been run.</p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/checks/${reviewId}`}>
                Open saved details
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <ArtworkViewer artwork={preview} checks={[]} onSelect={() => {}} />
          <p className="scope-note">Re-select files after reload. No file contents are stored.</p>
        </section>
      )}
    </>
  );
}

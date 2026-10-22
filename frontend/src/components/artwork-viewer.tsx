'use client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  ExternalLink,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ScanLine,
} from 'lucide-react';
import type { ArtworkVersion, CheckResult } from '@/domain/types';
import { rotateRegion } from '@/domain/geometry';
import { Button } from './ui/button';
const PdfPage = dynamic(() => import('./pdf-page'), {
  ssr: false,
  loading: () => (
    <div role="status" className="pdf-loading">
      Loading PDF viewer…
    </div>
  ),
});
export function ArtworkViewer({
  artwork,
  checks,
  selected,
  onSelect,
}: {
  artwork: ArtworkVersion;
  checks: CheckResult[];
  selected?: CheckResult;
  onSelect: (id: string) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 650, height: 570 });
  const [pageOverride, setPageOverride] = useState<{ check?: string; page: number }>({ page: 1 });
  const [zoom, setZoom] = useState<number | null>(null);
  const [turns, setTurns] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const page =
    pageOverride.check === selected?.id ? pageOverride.page : (selected?.evidence.page ?? 1);
  const pageInfo = artwork.pages[page - 1];
  const rotation = (pageInfo.rotation + turns * 90) % 360;
  const rotated = rotation === 90 || rotation === 270;
  const width = rotated ? pageInfo.height : pageInfo.width;
  const height = rotated ? pageInfo.width : pageInfo.height;
  const fit = Math.max(
    0.1,
    Math.min((bounds.width - 48) / width, (bounds.height - 48) / height, 1),
  );
  const scale = zoom ?? fit;
  const renderedW = width * scale;
  const renderedH = height * scale;
  useEffect(() => {
    const element = viewport.current!;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setBounds({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!selected?.evidence.region || selected.evidence.page !== page) return;
    const region = rotateRegion(selected.evidence.region, rotation);
    viewport.current?.scrollTo({
      left: Math.max(0, renderedW * (region.x + region.width / 2) + 24 - bounds.width / 2),
      top: Math.max(0, renderedH * (region.y + region.height / 2) + 24 - bounds.height / 2),
      behavior: 'instant',
    });
  }, [selected, page, rotation, renderedW, renderedH, bounds]);
  const regions = checks.filter((c) => c.evidence.page === page && c.evidence.region);
  const imageTransform =
    rotation === 90
      ? `translate(${pageInfo.height}px, 0) rotate(90deg)`
      : rotation === 180
        ? `translate(${pageInfo.width}px, ${pageInfo.height}px) rotate(180deg)`
        : rotation === 270
          ? `translate(0, ${pageInfo.width}px) rotate(270deg)`
          : '';
  return (
    <section className="panel artwork-panel" aria-label="Artwork viewer">
      <div className="viewer-heading">
        <div>
          <span className="eyebrow">Artwork</span>
          <p className="viewer-filename">
            {artwork.filename}
            <span className="version-label">V{artwork.version}</span>
          </p>
        </div>
        <a
          href={artwork.url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open original artwork in a new tab"
        >
          <ExternalLink size={16} />
        </a>
      </div>
      <div className="viewer-toolbar">
        <div className="page-controls">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPageOverride({ check: selected?.id, page: page - 1 })}
          >
            <ChevronLeft size={16} />
          </Button>
          <label htmlFor="artwork-page-select" className="sr-only">
            Artwork page
          </label>
          <select
            id="artwork-page-select"
            value={page}
            onChange={(e) => setPageOverride({ check: selected?.id, page: Number(e.target.value) })}
          >
            {artwork.pages.map((_, index) => (
              <option key={index} value={index + 1}>
                Page {index + 1} of {artwork.pages.length}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next page"
            disabled={page >= artwork.pages.length}
            onClick={() => setPageOverride({ check: selected?.id, page: page + 1 })}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        <div className="zoom-controls">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            disabled={scale <= 0.15}
            onClick={() => setZoom(Math.max(0.1, scale - 0.2))}
          >
            <ZoomOut size={16} />
          </Button>
          <output aria-label="Zoom level">{Math.round(scale * 100)}%</output>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            disabled={scale >= 3}
            onClick={() => setZoom(Math.min(3, scale + 0.2))}
          >
            <ZoomIn size={16} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Fit page" onClick={() => setZoom(null)}>
            <Expand size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Rotate clockwise"
            onClick={() => setTurns((n) => n + 1)}
          >
            <RotateCw size={16} />
          </Button>
        </div>
      </div>
      <div
        className="viewer-viewport"
        ref={viewport}
        tabIndex={0}
        role="region"
        aria-label="Scrollable artwork canvas"
      >
        <div
          className="artwork-centering"
          style={{
            minWidth: '100%',
            width: renderedW + 48,
            minHeight: '100%',
            height: renderedH + 48,
          }}
        >
          <div
            className="artwork-page"
            data-testid="artwork-page"
            data-rotation={rotation}
            data-page={page}
            style={{ width: renderedW, height: renderedH }}
          >
            {artwork.fileType === 'application/pdf' ? (
              <PdfPage url={artwork.url} page={page} scale={scale} rotation={rotation} />
            ) : (
              <div
                style={{
                  width: pageInfo.width,
                  height: pageInfo.height,
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                  position: 'absolute',
                }}
              >
                <div
                  style={{
                    transform: imageTransform,
                    transformOrigin: '0 0',
                    width: pageInfo.width,
                    height: pageInfo.height,
                  }}
                >
                  <Image
                    unoptimized
                    loading="eager"
                    key={`${artwork.id}-${imageAttempt}`}
                    src={pageInfo.url || artwork.url}
                    width={pageInfo.width}
                    height={pageInfo.height}
                    alt={`${artwork.filename}, page ${page}`}
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                </div>
              </div>
            )}
            {imageError && (
              <div role="alert" className="viewer-error">
                <p>Artwork could not load.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImageAttempt((n) => n + 1);
                  }}
                >
                  Retry artwork
                </Button>
              </div>
            )}
            {regions.map((c) => {
              const region = rotateRegion(c.evidence.region!, rotation);
              const index = checks.findIndex((x) => x.id === c.id) + 1;
              return (
                <button
                  key={c.id}
                  className={`artwork-marker ${c.id === selected?.id ? 'selected' : ''}`}
                  data-testid={c.id === selected?.id ? 'selected-marker' : undefined}
                  aria-label={`Marker ${index}: ${c.title}`}
                  aria-pressed={c.id === selected?.id}
                  onClick={() => onSelect(c.id)}
                  style={{
                    left: `${region.x * 100}%`,
                    top: `${region.y * 100}%`,
                    width: `${region.width * 100}%`,
                    height: `${region.height * 100}%`,
                  }}
                >
                  <span>{index}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="viewer-caption">
        <ScanLine size={15} />
        <span>
          {selected && !selected.evidence.region
            ? selected.evidence.inspectedPanels
            : 'Select a numbered marker or a finding to inspect its evidence.'}
        </span>
      </div>
    </section>
  );
}

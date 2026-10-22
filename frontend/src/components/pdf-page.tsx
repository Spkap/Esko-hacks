'use client';
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
export default function PdfPage({
  url,
  page,
  scale,
  rotation,
}: {
  url: string;
  page: number;
  scale: number;
  rotation: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let renderTask: RenderTask | undefined;
    const target = canvas.current!;
    target.dataset.rendered = 'false';
    async function render() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (!active) return;
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        loadingTask = pdfjs.getDocument({ url, useSystemFonts: true });
        const doc = await loadingTask.promise;
        const pdfPage = await doc.getPage(page);
        if (!active) return;
        const viewport = pdfPage.getViewport({ scale, rotation });
        const dpr = window.devicePixelRatio || 1;
        target.width = Math.ceil(viewport.width * dpr);
        target.height = Math.ceil(viewport.height * dpr);
        target.style.width = `${viewport.width}px`;
        target.style.height = `${viewport.height}px`;
        renderTask = pdfPage.render({
          canvas: target,
          viewport,
          transform: [dpr, 0, 0, dpr, 0, 0],
        });
        await renderTask.promise;
        if (active) {
          target.dataset.rendered = 'true';
          setError('');
        }
      } catch (err) {
        if (active && (err as Error).name !== 'RenderingCancelledException')
          setError('The PDF could not be rendered. Retry or open the original artwork.');
      }
    }
    void render();
    return () => {
      active = false;
      renderTask?.cancel();
      void loadingTask?.destroy();
    };
  }, [url, page, scale, rotation, attempt]);
  return (
    <>
      <canvas ref={canvas} role="img" aria-label={`Artwork PDF page ${page}`} />
      {error && (
        <div className="viewer-error" role="alert">
          <p>{error}</p>
          <button onClick={() => setAttempt((n) => n + 1)} className="link">
            Retry PDF
          </button>
        </div>
      )}
    </>
  );
}

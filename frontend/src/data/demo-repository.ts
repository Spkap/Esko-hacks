import { artworks, checks, references, reviews, runs } from '@/demo/fixtures';
import { decisionSchema, reviewSchema } from '@/domain/types';
import type {
  ArtworkVersion,
  ReferenceDocument,
  ReviewDecision,
  ReviewRepository,
  Run,
} from '@/domain/types';
import { summarize } from '@/domain/summary';

const storageKey = 'veriforge-decisions-v1';
export function createDemoRepository(): ReviewRepository {
  let reviewData = structuredClone(reviews);
  let artworkData = structuredClone(artworks);
  let referenceData = structuredClone(references);
  let runData = structuredClone(runs);
  let decisions: ReviewDecision[] = [];
  let loaded = false;
  const load = () => {
    if (loaded || typeof window === 'undefined') return;
    loaded = true;
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      decisions = decisionSchema
        .array()
        .parse(parsed)
        .filter((d) => checks.some((c) => c.id === d.checkId));
    } catch {
      decisions = [];
    }
  };
  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(decisions));
    } catch {
      /* In-memory decisions remain usable when storage is blocked. */
    }
  };
  const findReview = (id: string) => {
    const review = reviewData.find((r) => r.id === id);
    if (!review) throw new Error('Review not found.');
    return review;
  };
  const hash = async (file: File) =>
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  return {
    async listReviews(query = {}) {
      let items = reviewData.flatMap((review) => {
        const run = runData.find((r) => r.id === review.latestRunId);
        const artwork = artworkData.find((a) => a.id === review.currentArtworkVersionId);
        return run && artwork
          ? [{ ...review, run, artwork, checks: checks.filter((c) => c.runId === run.id) }]
          : [];
      });
      if (query.search)
        items = items.filter((r) =>
          r.productName.toLocaleLowerCase().includes(query.search!.toLocaleLowerCase()),
        );
      if (query.market) items = items.filter((r) => r.market === query.market);
      if (query.result)
        items = items.filter((r) => summarize(r.run.status, r.checks).label === query.result);
      const offset = Math.max(0, Number(query.cursor) || 0);
      const limit = Math.max(1, query.limit ?? 100);
      return {
        items: items.slice(offset, offset + limit),
        nextCursor: offset + limit < items.length ? String(offset + limit) : undefined,
      };
    },
    async getReview(id) {
      const review = reviewData.find((r) => r.id === id);
      return review
        ? {
            review,
            artworkVersions: artworkData.filter((a) => a.reviewId === id),
            references: referenceData.filter((r) => r.reviewId === id),
          }
        : null;
    },
    async createReview(input) {
      const now = new Date().toISOString();
      const review = reviewSchema.parse({
        ...input,
        id: crypto.randomUUID(),
        currentArtworkVersionId: '',
        createdAt: now,
        updatedAt: now,
      });
      reviewData.push(review);
      return review;
    },
    async addArtwork(reviewId, file) {
      const review = findReview(reviewId);
      if (
        !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) ||
        file.size > 20 * 1024 * 1024
      )
        throw new Error('Use a PDF, PNG, or JPEG no larger than 20 MiB.');
      const artwork: ArtworkVersion = {
        id: crypto.randomUUID(),
        reviewId,
        version: artworkData.filter((a) => a.reviewId === reviewId).length + 1,
        filename: file.name,
        fileHash: await hash(file),
        fileType: file.type as ArtworkVersion['fileType'],
        url: URL.createObjectURL(file),
        pages: [{ width: 1, height: 1, rotation: 0 }],
      };
      artworkData.push(artwork);
      review.currentArtworkVersionId = artwork.id;
      return artwork;
    },
    async addReference(reviewId, file, role, approvalStatus) {
      findReview(reviewId);
      const ref: ReferenceDocument = {
        id: crypto.randomUUID(),
        reviewId,
        revision:
          referenceData.filter((r) => r.reviewId === reviewId && r.role === role).length + 1,
        title: file.name,
        fileHash: await hash(file),
        role,
        approvalStatus,
        readingStatus: 'unread',
        url: URL.createObjectURL(file),
      };
      referenceData.push(ref);
      return ref;
    },
    async startRun(input) {
      const existing = runData.find((r) => r.requestKey === input.requestKey);
      if (existing) return existing;
      findReview(input.reviewId);
      if (
        !artworkData.some((a) => a.id === input.artworkVersionId && a.reviewId === input.reviewId)
      )
        throw new Error('Artwork does not belong to this review.');
      if (
        input.referenceIds.some(
          (id) => !referenceData.some((r) => r.id === id && r.reviewId === input.reviewId),
        )
      )
        throw new Error('Reference does not belong to this review.');
      // User uploads cannot inherit predetermined fixture findings.
      const run: Run = {
        ...input,
        id: crypto.randomUUID(),
        mode: 'demo',
        status: 'failed',
        createdAt: new Date().toISOString(),
      };
      runData.push(run);
      findReview(input.reviewId).latestRunId = run.id;
      return run;
    },
    async getRun(id) {
      return runData.find((r) => r.id === id) ?? null;
    },
    async cancelRun(id) {
      const run = runData.find((r) => r.id === id);
      if (!run) throw new Error('Run not found.');
      if (['queued', 'extracting', 'checking'].includes(run.status)) run.status = 'cancelled';
      return run;
    },
    async getReport(runId) {
      load();
      const run = runData.find((r) => r.id === runId);
      return run
        ? {
            run,
            checks: checks.filter((c) => c.runId === runId),
            reviewedScope:
              'Temporary fictional fixture · supplied artwork panels and selected comparisons only. Results are simulated.',
            uncheckedRequirements: [
              'Full market regulatory review',
              'Nutrition verification',
              'Assembled-package visibility',
              'Unselected brand requirements',
            ],
            decisions: decisions.filter((d) =>
              checks.some((c) => c.id === d.checkId && c.runId === runId),
            ),
          }
        : null;
    },
    async recordDecision(checkId, action, reason = '') {
      load();
      if (!checks.some((c) => c.id === checkId)) throw new Error('Check not found.');
      const decision = decisionSchema.parse({
        checkId,
        action,
        reason: reason.trim(),
        actor: 'Demo reviewer',
        timestamp: new Date().toISOString(),
      });
      decisions = [...decisions.filter((d) => d.checkId !== checkId), decision];
      save();
      return decision;
    },
    async reset() {
      artworkData
        .filter((a) => a.url.startsWith('blob:'))
        .forEach((a) => URL.revokeObjectURL(a.url));
      referenceData
        .filter((r) => r.url.startsWith('blob:'))
        .forEach((r) => URL.revokeObjectURL(r.url));
      reviewData = structuredClone(reviews);
      artworkData = structuredClone(artworks);
      referenceData = structuredClone(references);
      runData = structuredClone(runs);
      decisions = [];
      loaded = true;
      save();
    },
  };
}

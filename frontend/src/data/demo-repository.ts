import { artworks, checks, references, reviews, runs } from '@/demo/fixtures';
import {
  artworkSchema,
  referenceSchema,
  decisionSchema,
  reviewSchema,
  runSchema,
} from '@/domain/types';
import type {
  ArtworkVersion,
  ReferenceDocument,
  ReviewDecision,
  ReviewRepository,
  Run,
} from '@/domain/types';
import { isSampleScenario } from '@/demo/scenarios';
import { summarize } from '@/domain/summary';

const storageKey = 'veriforge-decisions-v1';
export function createDemoRepository(): ReviewRepository {
  let reviewData = structuredClone(reviews);
  let artworkData = structuredClone(artworks);
  let referenceData = structuredClone(references);
  let runData = structuredClone(runs);
  let checkData = structuredClone(checks);
  let samplesLoaded = false;
  const sampleStorageKey = 'wavelength-sample-runs-v1';
  const attachSampleRun = (run: Run) => {
    const seed = runs.find((r) => r.reviewId === run.reviewId);
    if (
      !seed ||
      !isSampleScenario(run.reviewId) ||
      !run.id.startsWith('sample-') ||
      run.mode !== 'demo' ||
      run.status !== 'completed' ||
      run.artworkVersionId !== seed.artworkVersionId ||
      run.ruleSetVersion !== seed.ruleSetVersion ||
      JSON.stringify(run.referenceIds) !== JSON.stringify(seed.referenceIds) ||
      JSON.stringify(run.selectedRuleIds) !== JSON.stringify(seed.selectedRuleIds)
    )
      return;
    if (runData.some((r) => r.id === run.id)) return;
    runData.push(run);
    checkData.push(
      ...checks
        .filter((c) => c.runId === seed.id)
        .map((c) => ({ ...structuredClone(c), id: `${run.id}:${c.id}`, runId: run.id })),
    );
    const review = reviewData.find((r) => r.id === run.reviewId)!;
    review.latestRunId = run.id;
    review.updatedAt = run.createdAt;
  };
  const loadSamples = () => {
    if (samplesLoaded || typeof window === 'undefined') return;
    samplesLoaded = true;
    try {
      const saved = runSchema
        .array()
        .max(20)
        .parse(JSON.parse(sessionStorage.getItem(sampleStorageKey) || '[]'));
      saved.forEach(attachSampleRun);
    } catch {
      /* Optional session storage: immutable seed examples remain available. */
    }
  };
  const saveSamples = () => {
    try {
      sessionStorage.setItem(
        sampleStorageKey,
        JSON.stringify(runData.filter((r) => r.id.startsWith('sample-')).slice(-20)),
      );
    } catch {
      /* In-memory demo remains usable. */
    }
  };
  let decisions: ReviewDecision[] = [];
  let loaded = false;
  let metadataLoaded = false;
  const loadMetadata = () => {
    if (metadataLoaded || typeof window === 'undefined') return;
    metadataLoaded = true;
    try {
      const data = JSON.parse(sessionStorage.getItem('veriforge-upload-metadata-v1') || 'null');
      if (!data) return;
      const uploadedReviews = reviewSchema.array().parse(data.reviews);
      const uploadedArtwork = artworkSchema.array().parse(data.artworks);
      const uploadedReferences = referenceSchema.array().parse(data.references);
      reviewData.push(...uploadedReviews.filter((r) => !reviewData.some((old) => old.id === r.id)));
      artworkData.push(
        ...uploadedArtwork.filter((a) => !artworkData.some((old) => old.id === a.id)),
      );
      referenceData.push(
        ...uploadedReferences.filter((r) => !referenceData.some((old) => old.id === r.id)),
      );
    } catch {
      /* Corrupt or blocked session storage does not prevent the demo. */
    }
  };
  const saveMetadata = () => {
    try {
      const uploaded = reviewData
        .filter((r) => !reviews.some((seed) => seed.id === r.id))
        .slice(-20);
      const ids = new Set(uploaded.map((r) => r.id));
      sessionStorage.setItem(
        'veriforge-upload-metadata-v1',
        JSON.stringify({
          reviews: uploaded,
          artworks: artworkData.filter((a) => ids.has(a.reviewId)).map((a) => ({ ...a, url: '' })),
          references: referenceData
            .filter((r) => ids.has(r.reviewId))
            .map((r) => ({ ...r, url: '' })),
        }),
      );
    } catch {
      /* Preview still works without persistence. */
    }
  };
  const load = () => {
    if (loaded || typeof window === 'undefined') return;
    loaded = true;
    loadSamples();
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      decisions = decisionSchema
        .array()
        .parse(parsed)
        .filter((d) => checkData.some((c) => c.id === d.checkId));
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
    loadMetadata();
    loadSamples();
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
      loadMetadata();
      loadSamples();
      let items = reviewData.flatMap((review) => {
        const run = runData.find((r) => r.id === review.latestRunId);
        const artwork = artworkData.find((a) => a.id === review.currentArtworkVersionId);
        return run && artwork
          ? [{ ...review, run, artwork, checks: checkData.filter((c) => c.runId === run.id) }]
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
      loadMetadata();
      loadSamples();
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
      loadMetadata();
      const now = new Date().toISOString();
      const review = reviewSchema.parse({
        ...input,
        id: crypto.randomUUID(),
        currentArtworkVersionId: '',
        createdAt: now,
        updatedAt: now,
      });
      reviewData.push(review);
      saveMetadata();
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
      saveMetadata();
      return artwork;
    },
    async addReference(reviewId, file, role, approvalStatus) {
      findReview(reviewId);
      if (
        !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) ||
        !file.size ||
        file.size > 20 * 1024 * 1024
      )
        throw new Error('Use a non-empty PDF, PNG, or JPEG no larger than 20 MiB.');
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
      saveMetadata();
      return ref;
    },
    async startRun(input) {
      loadSamples();
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
      const seed = runs.find((r) => r.reviewId === input.reviewId);
      if (seed && isSampleScenario(input.reviewId)) {
        if (
          input.artworkVersionId !== seed.artworkVersionId ||
          input.ruleSetVersion !== seed.ruleSetVersion ||
          JSON.stringify(input.referenceIds) !== JSON.stringify(seed.referenceIds) ||
          JSON.stringify(input.selectedRuleIds) !== JSON.stringify(seed.selectedRuleIds)
        ) {
          throw new Error('Use the supplied sample files and selected checks.');
        }
        const run: Run = {
          ...structuredClone(seed),
          id: `sample-${crypto.randomUUID()}`,
          requestKey: input.requestKey,
          createdAt: new Date().toISOString(),
        };
        attachSampleRun(run);
        saveSamples();
        return run;
      }
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
      loadSamples();
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
            checks: checkData.filter((c) => c.runId === runId),
            reviewedScope:
              'Simulated results for the supplied artwork panels and selected checks only.',
            uncheckedRequirements: [
              'Full market regulatory review',
              'Nutrition verification',
              'Printed type size and physical dimensions',
              'Assembled-package visibility',
              'Unselected brand requirements',
            ],
            decisions: decisions.filter((d) =>
              checkData.some((c) => c.id === d.checkId && c.runId === runId),
            ),
          }
        : null;
    },
    async recordDecision(checkId, action, reason = '') {
      load();
      if (!checkData.some((c) => c.id === checkId)) throw new Error('Check not found.');
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
      checkData = structuredClone(checks);
      samplesLoaded = true;
      metadataLoaded = true;
      try {
        sessionStorage.removeItem(sampleStorageKey);
        sessionStorage.removeItem('veriforge-upload-draft-v1');
      } catch {
        /* Storage is optional. */
      }
      decisions = [];
      loaded = true;
      saveMetadata();
      save();
    },
  };
}

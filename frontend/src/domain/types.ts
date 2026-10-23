import { z } from 'zod';

export const applicabilitySchema = z.enum(['applicable', 'not_applicable', 'uncertain']);
export const resultSchema = z.enum(['pass', 'fail', 'needs_review', 'not_checked']);
export const jobStatusSchema = z.enum([
  'queued',
  'extracting',
  'checking',
  'completed',
  'failed',
  'cancelled',
]);
export const regionSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .refine((r) => r.x + r.width <= 1 && r.y + r.height <= 1, 'Region must fit within the page');
export const reviewSchema = z.object({
  id: z.string().min(1),
  productName: z.string().min(1),
  productImage: z.object({ src: z.string(), alt: z.string() }).optional(),
  category: z.string().min(1),
  market: z.string().min(1),
  currentArtworkVersionId: z.string(),
  latestRunId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Review = z.infer<typeof reviewSchema>;
export const artworkSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  version: z.number().int().positive(),
  filename: z.string(),
  fileHash: z.string(),
  fileType: z.enum(['image/svg+xml', 'image/png', 'image/jpeg', 'application/pdf']),
  url: z.string(),
  pages: z
    .array(
      z.object({
        width: z.number().positive(),
        height: z.number().positive(),
        rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
        url: z.string().optional(),
      }),
    )
    .min(1),
});
export type ArtworkVersion = z.infer<typeof artworkSchema>;
export const referenceRoleSchema = z.enum([
  'regulatory_reference',
  'company_policy',
  'product_specification',
]);
export const approvalSchema = z.enum(['draft', 'approved', 'unknown']);
export const referenceSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  revision: z.number().int().positive(),
  title: z.string(),
  fileHash: z.string(),
  role: referenceRoleSchema,
  approvalStatus: approvalSchema,
  readingStatus: z.enum(['read', 'unread', 'partial', 'failed']),
  url: z.string(),
});
export type ReferenceDocument = z.infer<typeof referenceSchema>;
export const runSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  artworkVersionId: z.string(),
  referenceIds: z.array(z.string()),
  ruleSetVersion: z.string(),
  selectedRuleIds: z.array(z.string()),
  mode: z.enum(['demo', 'live']),
  status: jobStatusSchema,
  requestKey: z.string(),
  error: z
    .object({ message: z.string(), code: z.string().optional() })
    .passthrough()
    .nullable()
    .optional(),
  createdAt: z.string(),
});
export type Run = z.infer<typeof runSchema>;
export const checkSchema = z.object({
  id: z.string(),
  runId: z.string(),
  ruleId: z.string(),
  ruleVersion: z.string(),
  title: z.string(),
  kind: z.enum(['regulatory', 'product_data', 'brand']),
  applicability: applicabilitySchema,
  result: resultSchema,
  observed: z.string(),
  expected: z.string(),
  suggestedCorrection: z.string(),
  reason: z.string().optional(),
  aiExplanation: z
    .object({
      status: z.enum([
        'disabled',
        'unavailable',
        'no_source',
        'input_limit',
        'budget_exhausted',
        'explained',
        'provider_failed',
        'rejected',
      ]),
      promptVersion: z.string(),
      model: z.string().optional(),
      explanation: z.string().optional(),
      sourceIds: z.array(z.string()).optional(),
    })
    .optional(),
  evidence: z.object({
    artworkVersionId: z.string(),
    page: z.number().int().positive(),
    region: regionSchema.optional(),
    inspectedPanels: z.string(),
    sourceId: z.string(),
    sourceLocation: z.string(),
    excerpt: z.string(),
  }),
});
export type CheckResult = z.infer<typeof checkSchema>;
export const decisionSchema = z
  .object({
    checkId: z.string(),
    action: z.enum(['open', 'acknowledged', 'dismissed']),
    actor: z.string(),
    reason: z.string(),
    timestamp: z.string(),
  })
  .refine(
    (d) => d.action !== 'dismissed' || d.reason.trim().length > 0,
    'A dismissal requires a reason',
  );
export type ReviewDecision = z.infer<typeof decisionSchema>;
export const reportSchema = z.object({
  run: runSchema,
  checks: z.array(checkSchema),
  reviewedScope: z.string(),
  uncheckedRequirements: z.array(z.string()),
  decisions: z.array(decisionSchema),
});
export const reviewDetailSchema = z.object({
  review: reviewSchema,
  artworkVersions: z.array(artworkSchema),
  references: z.array(referenceSchema),
  runs: z.array(runSchema).optional(),
});
export const reviewListSchema = z.object({
  items: z.array(
    reviewSchema.extend({ run: runSchema, checks: z.array(checkSchema), artwork: artworkSchema }),
  ),
  nextCursor: z.string().optional(),
});
export type Report = {
  run: Run;
  checks: CheckResult[];
  reviewedScope: string;
  uncheckedRequirements: string[];
  decisions: ReviewDecision[];
};
export type ReviewDetail = {
  review: Review;
  artworkVersions: ArtworkVersion[];
  references: ReferenceDocument[];
  runs?: Run[];
};
export type ReviewListItem = Review & { run: Run; checks: CheckResult[]; artwork: ArtworkVersion };
export type ReviewQuery = {
  search?: string;
  market?: string;
  result?: string;
  cursor?: string;
  limit?: number;
};
export interface ReviewRepository {
  listReviews(query?: ReviewQuery): Promise<{ items: ReviewListItem[]; nextCursor?: string }>;
  getReview(id: string): Promise<ReviewDetail | null>;
  createReview(input: Pick<Review, 'productName' | 'market' | 'category'>): Promise<Review>;
  addArtwork(reviewId: string, file: File): Promise<ArtworkVersion>;
  addReference(
    reviewId: string,
    file: File,
    role: ReferenceDocument['role'],
    status: ReferenceDocument['approvalStatus'],
  ): Promise<ReferenceDocument>;
  startRun(input: Omit<Run, 'id' | 'mode' | 'status' | 'createdAt'>): Promise<Run>;
  getRun(id: string): Promise<Run | null>;
  cancelRun(id: string): Promise<Run>;
  getReport(runId: string): Promise<Report | null>;
  recordDecision(
    checkId: string,
    action: ReviewDecision['action'],
    reason?: string,
  ): Promise<ReviewDecision>;
  reset(): Promise<void>;
}

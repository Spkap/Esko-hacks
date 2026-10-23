import { z } from 'zod';
import {
  artworkSchema,
  referenceSchema,
  reviewSchema,
  reviewDetailSchema,
  reviewListSchema,
  runSchema,
  reportSchema,
  decisionSchema,
  type ReviewRepository,
} from '@/domain/types';
export class RepositoryError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = 'REQUEST_FAILED',
    public retryable = false,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
export function createHttpRepository(
  base = '/api/backend/v1',
  transport: typeof fetch = fetch,
  timeoutMs = 30000,
): ReviewRepository {
  function files<T>(value: T): T {
    if (Array.isArray(value)) return value.map(files) as T;
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          key === 'url' && typeof item === 'string' && /^\/v1\/files\/[^/]+$/.test(item)
            ? `/api/backend${item}`
            : files(item),
        ]),
      ) as T;
    return value;
  }
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    init?: RequestInit,
    nullable = false,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await transport(`${base}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...init?.headers,
        },
      });
      if (nullable && response.status === 404) return null as T;
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new RepositoryError(
          error.message || `Request failed (${response.status}). Try again.`,
          response.status,
          error.code,
          error.retryable,
        );
      }
      const value = await response.json().catch(() => {
        throw new RepositoryError(
          'The service returned invalid JSON. Please retry.',
          502,
          'INVALID_RESPONSE',
          true,
        );
      });
      const parsed = schema.safeParse(value);
      if (!parsed.success)
        throw new RepositoryError(
          'The service returned an invalid response. Please retry.',
          502,
          'INVALID_RESPONSE',
          true,
        );
      return files(parsed.data);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(
        controller.signal.aborted
          ? 'The request timed out. Please retry.'
          : 'Cannot reach the analysis service. Check the connection and retry.',
        0,
        controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
        true,
      );
    } finally {
      clearTimeout(timer);
    }
  }
  const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
  const upload = (file: File, role?: string, approvalStatus?: string): RequestInit => {
    const body = new FormData();
    body.set('file', file);
    if (role) body.set('role', role);
    if (approvalStatus) body.set('approvalStatus', approvalStatus);
    return { method: 'POST', body };
  };
  return {
    listReviews(query = {}) {
      const params = new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)]),
      );
      return request(`/reviews?${params}`, reviewListSchema);
    },
    getReview: (id) =>
      request(`/reviews/${encodeURIComponent(id)}`, reviewDetailSchema.nullable(), undefined, true),
    createReview: (input) => request('/reviews', reviewSchema, post(input)),
    addArtwork: (id, file) =>
      request(`/reviews/${encodeURIComponent(id)}/artworks`, artworkSchema, upload(file)),
    addReference: (id, file, role, status) =>
      request(
        `/reviews/${encodeURIComponent(id)}/references`,
        referenceSchema,
        upload(file, role, status),
      ),
    startRun: (input) => request('/runs', runSchema, post(input)),
    getRun: (id) =>
      request(`/runs/${encodeURIComponent(id)}`, runSchema.nullable(), undefined, true),
    cancelRun: (id) => request(`/runs/${encodeURIComponent(id)}/cancel`, runSchema, post({})),
    getReport: (id) =>
      request(`/runs/${encodeURIComponent(id)}/report`, reportSchema.nullable(), undefined, true),
    recordDecision: (id, action, reason = '') =>
      request(
        `/checks/${encodeURIComponent(id)}/decisions`,
        decisionSchema,
        post({ action, reason }),
      ),
    reset: async () => {
      throw new Error('Live reviews cannot be reset.');
    },
  };
}

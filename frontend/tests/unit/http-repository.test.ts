import { describe, it, expect, vi } from 'vitest';
import { createHttpRepository } from '@/data/http-repository';
import { artworks } from '@/demo/fixtures';

describe('HTTP repository', () => {
  it('rejects malformed successful responses', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({ items: [{}] }));
    await expect(createHttpRepository('/v1', transport).listReviews()).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
  it.each([401, 500])('preserves structured %s errors', async (status) => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { code: 'FAILURE', message: 'Service rejected request', retryable: status === 500 },
          { status },
        ),
      );
    await expect(
      createHttpRepository('/v1', transport).createReview({
        productName: 'Test',
        market: 'Japan',
        category: 'Fruit beverage',
      }),
    ).rejects.toMatchObject({ status, message: 'Service rejected request' });
  });
  it('times out uploads and sends file bytes as multipart', async () => {
    const transport = vi.fn(
      (_url, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal!.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          ),
        ),
    );
    const repo = createHttpRepository('/v1', transport as typeof fetch, 10);
    await expect(
      repo.addArtwork(
        'review',
        new File(['real bytes'], 'artwork.pdf', { type: 'application/pdf' }),
      ),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
    const body = transport.mock.calls[0][1].body as FormData;
    expect(await (body.get('file') as File).text()).toBe('real bytes');
    expect(new Headers(transport.mock.calls[0][1].headers).has('Authorization')).toBe(false);
  });
  it('uploads reference role and declared approval without exposing credentials', async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          id: 'reference',
          reviewId: 'review',
          revision: 1,
          title: 'spec.json',
          fileHash: 'hash',
          role: 'product_specification',
          approvalStatus: 'approved',
          readingStatus: 'unread',
          url: '/v1/files/reference',
        }),
      );
    const result = await createHttpRepository('/v1', transport).addReference(
      'review',
      new File(['{}'], 'spec.json', { type: 'application/json' }),
      'product_specification',
      'approved',
    );
    const body = transport.mock.calls[0][1].body as FormData;
    expect(body.get('approvalStatus')).toBe('approved');
    expect(body.get('role')).toBe('product_specification');
    expect(result.url).toBe('/api/backend/v1/files/reference');
  });
  it('validates and maps private artwork links', async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(Response.json({ ...artworks[0], url: '/v1/files/artwork' }));
    const result = await createHttpRepository('/v1', transport).addArtwork(
      'review',
      new File(['bytes'], 'label.png'),
    );
    expect(result.url).toBe('/api/backend/v1/files/artwork');
  });
  it('does not reset live reviews', async () => {
    await expect(createHttpRepository().reset()).rejects.toThrow('cannot be reset');
  });
});

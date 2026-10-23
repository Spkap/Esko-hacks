import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/backend/[...path]/route';
const context = { params: Promise.resolve({ path: ['v1', 'reviews'] }) };
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('local reviewer bridge', () => {
  it('accepts same-origin loopback mutations even when Next internal origin differs', async () => {
    vi.stubEnv('WAVELENGTH_API_TOKEN', 'server-token');
    const fetcher = vi.fn().mockResolvedValue(Response.json({ id: 'real-response' }));
    vi.stubGlobal('fetch', fetcher);
    const request = new NextRequest('http://localhost:3000/api/backend/v1/reviews', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:3000',
        origin: 'http://127.0.0.1:3000',
        'content-type': 'application/json',
      },
      body: '{}',
    });
    const response = await POST(request, context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'real-response' });
    expect((fetcher.mock.calls[0][1].headers as Headers).get('Authorization')).toBe(
      'Bearer server-token',
    );
    expect(response.headers.get('Authorization')).toBeNull();
  });
  it('rejects remote hosts and cross-origin requests before using credentials', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const remote = new NextRequest('https://public.example/api/backend/v1/reviews', {
      headers: { host: 'public.example' },
    });
    expect((await GET(remote, context)).status).toBe(403);
    const crossed = new NextRequest('http://localhost:3000/api/backend/v1/reviews', {
      method: 'POST',
      headers: { host: 'localhost:3000', origin: 'https://evil.example' },
      body: '{}',
    });
    expect((await POST(crossed, context)).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('fails closed without server credentials', async () => {
    vi.stubEnv('WAVELENGTH_API_TOKEN', '');
    const request = new NextRequest('http://localhost:3000/api/backend/v1/reviews', {
      headers: { host: 'localhost:3000' },
    });
    expect((await GET(request, context)).status).toBe(503);
  });
});

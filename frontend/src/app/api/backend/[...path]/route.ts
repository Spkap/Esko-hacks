import { NextRequest } from 'next/server';
import { reviewerSession, trustedOrigin } from '@/lib/cloud-session';
export const runtime = 'nodejs';
const limit = 21 * 1024 * 1024;
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!trustedOrigin(request))
    return Response.json(
      { message: 'This request is not from an allowed workspace origin.' },
      { status: 403 },
    );
  if (path[0] !== 'v1' || path.some((p) => !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(p)))
    return Response.json({ message: 'Invalid service path.' }, { status: 400 });
  let session;
  try {
    session = reviewerSession(request);
  } catch {
    return Response.json({ message: 'Workspace sessions are not configured.' }, { status: 503 });
  }
  const token = session.token;
  if (!token)
    return Response.json(
      { message: 'Local reviewer credentials are not configured.' },
      { status: 503 },
    );
  if (Number(request.headers.get('content-length') || 0) > limit)
    return Response.json({ message: 'File exceeds the 20 MiB upload limit.' }, { status: 413 });
  try {
    let body: Uint8Array<ArrayBuffer> | undefined;
    if (!['GET', 'HEAD'].includes(request.method) && request.body) {
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > limit) {
          await reader.cancel();
          return Response.json({ message: 'Upload too large.' }, { status: 413 });
        }
        chunks.push(chunk.value);
      }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
    }
    const headers = new Headers({ Authorization: `Bearer ${token}` });
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    const response = await fetch(
      `${(process.env.WAVELENGTH_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/${path.join('/')}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: 'no-store',
        signal: AbortSignal.timeout(35000),
      },
    );
    const resultHeaders = new Headers({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    const mime = response.headers.get('content-type') || 'application/octet-stream';
    const safe = /^(application\/(json|pdf)|image\/(png|jpeg))(;|$)/.test(mime);
    resultHeaders.set('Content-Type', safe ? mime : 'application/octet-stream');
    if (session.cookie) resultHeaders.set('Set-Cookie', session.cookie);
    if (!safe) resultHeaders.set('Content-Disposition', 'attachment');
    return new Response(response.body, { status: response.status, headers: resultHeaders });
  } catch {
    return Response.json(
      {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The analysis service is unavailable. Retry shortly.',
        retryable: true,
      },
      { status: 502 },
    );
  }
}
export { proxy as GET, proxy as POST };

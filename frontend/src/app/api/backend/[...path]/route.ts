import { NextRequest } from 'next/server';
export const runtime = 'nodejs';
const limit = 21 * 1024 * 1024;
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  // This bridge deliberately represents one LOCAL reviewer, not a public login.
  const host = request.headers.get('host') || '';
  const hostname = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0];
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname))
    return Response.json(
      { message: 'The local reviewer bridge only accepts loopback hosts.' },
      { status: 403 },
    );
  if (path[0] !== 'v1' || path.some((p) => !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(p)))
    return Response.json({ message: 'Invalid service path.' }, { status: 400 });
  if (
    !['GET', 'HEAD'].includes(request.method) &&
    request.headers.get('origin') !== `${request.nextUrl.protocol}//${host}`
  )
    return Response.json({ message: 'Same-origin requests required.' }, { status: 403 });
  const token = process.env.WAVELENGTH_API_TOKEN;
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
      `${process.env.WAVELENGTH_API_URL || 'http://127.0.0.1:8000'}/${path.join('/')}${request.nextUrl.search}`,
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

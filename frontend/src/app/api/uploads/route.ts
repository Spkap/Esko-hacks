import { NextRequest } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { cloudMode, reviewerSession, trustedOrigin } from '@/lib/cloud-session';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!cloudMode())
    return Response.json({ message: 'Direct cloud uploads are not enabled.' }, { status: 404 });
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!trustedOrigin(request)) throw new Error('Same-origin workspace required.');
        const session = reviewerSession(request);
        const payload = JSON.parse(clientPayload || '{}');
        if (
          !/^[a-f0-9-]{36}$/.test(payload.reviewId) ||
          !['artwork', 'reference'].includes(payload.kind) ||
          !pathname.startsWith(`reviews/${payload.reviewId}/${payload.kind}/`) ||
          pathname.includes('..')
        )
          throw new Error('Invalid upload destination.');
        const service = (process.env.WAVELENGTH_API_URL || '').replace(/\/$/, '');
        const review = await fetch(`${service}/v1/reviews/${payload.reviewId}`, {
          headers: { Authorization: `Bearer ${session.token}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        });
        if (!review.ok) throw new Error('The review is not available in this workspace.');
        return {
          maximumSizeInBytes: 20 * 1024 * 1024,
          validUntil: Date.now() + 15 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
          allowedContentTypes: [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'application/json',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/octet-stream',
          ],
          tokenPayload: JSON.stringify({ reviewId: payload.reviewId }),
        };
      },
      onUploadCompleted: async () => {
        /* Finalization validates actual bytes through the API. */
      },
    });
    return Response.json(response);
  } catch {
    return Response.json(
      { message: 'Private upload could not be authorized. Reload the workspace and retry.' },
      { status: 400 },
    );
  }
}

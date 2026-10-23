import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
const cookieName = '__Host-wavelength-session';
export const cloudMode = () => process.env.WAVELENGTH_DEPLOYMENT === 'cloud';
function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}
export function reviewerSession(request: NextRequest) {
  if (!cloudMode())
    return { token: process.env.WAVELENGTH_API_TOKEN || '', user: 'local-reviewer', cookie: '' };
  const secret = process.env.WAVELENGTH_JWT_SECRET || '';
  if (secret.length < 32) throw new Error('Workspace sessions are not configured.');
  const issuer = process.env.WAVELENGTH_JWT_ISSUER || 'wavelength-local';
  const audience = process.env.WAVELENGTH_JWT_AUDIENCE || 'wavelength-api';
  const existing = request.cookies.get(cookieName)?.value;
  if (existing) {
    try {
      const [header, payload, signature] = existing.split('.');
      const expected = sign(`${header}.${payload}`, secret);
      const value = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (
        signature &&
        signature.length === expected.length &&
        timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) &&
        value.iss === issuer &&
        value.aud === audience &&
        value.exp > Date.now() / 1000 &&
        /^guest-[a-f0-9-]{36}$/.test(value.sub)
      )
        return { token: existing, user: value.sub as string, cookie: '' };
    } catch {
      /* Invalid sessions start an isolated new workspace. */
    }
  }
  const user = `guest-${randomUUID()}`;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user,
      iss: issuer,
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 604800,
    }),
  ).toString('base64url');
  const token = `${header}.${payload}.${sign(`${header}.${payload}`, secret)}`;
  return {
    token,
    user,
    cookie: `${cookieName}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
  };
}
export function trustedOrigin(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0];
  const allowed = cloudMode()
    ? [
        process.env.VERCEL_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        ...(process.env.WAVELENGTH_ALLOWED_HOSTS || '').split(','),
      ].filter(Boolean)
    : ['localhost', '127.0.0.1', '[::1]'];
  return (
    allowed.includes(hostname) &&
    (['GET', 'HEAD'].includes(request.method) ||
      request.headers.get('origin') ===
        `${cloudMode() ? 'https:' : request.nextUrl.protocol}//${host}`)
  );
}

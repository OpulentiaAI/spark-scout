import { NextResponse } from 'next/server';

// Comma-separated list of additional trusted origins (e.g., https://app.example.com,https://staging.example.com)
const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function getSelfOrigin(request: Request): string {
  // Reconstruct origin from the incoming request URL
  // Works in Vercel/Next.js as the URL contains protocol + host
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function getAllowedOrigins(request: Request): string[] {
  const self = getSelfOrigin(request);
  const unique = new Set([self, ...envAllowedOrigins]);
  return Array.from(unique);
}

export function verifySameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const secFetchSite = request.headers.get('sec-fetch-site');
  const allowed = getAllowedOrigins(request);

  if (!origin) {
    // Non-browser or same-origin navigation may omit Origin; allow
    return { ok: true, reason: 'no-origin-header' } as const;
  }

  if (allowed.includes(origin)) {
    return { ok: true, reason: 'allowed-origin' } as const;
  }

  // Extra defense using Sec-Fetch-Site where available
  if (secFetchSite && (secFetchSite === 'same-origin' || secFetchSite === 'same-site')) {
    return { ok: true, reason: 'same-site' } as const;
  }

  return { ok: false, reason: `origin-not-allowed:${origin}` } as const;
}

export function assertJsonContentType(request: Request) {
  const ct = request.headers.get('content-type') || '';
  return ct.includes('application/json');
}

export function assertMultipartFormData(request: Request) {
  const ct = request.headers.get('content-type') || '';
  return ct.startsWith('multipart/form-data');
}

export function tooLargeByContentLength(request: Request, maxBytes: number): boolean {
  const cl = request.headers.get('content-length');
  if (!cl) return false;
  const n = Number(cl);
  if (!Number.isFinite(n)) return false;
  return n > maxBytes;
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status });
}

export function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Content-Type-Options': 'nosniff',
  };
}

export function noStoreHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}

export function sanitizeFilename(name: string, fallback = 'upload.bin'): string {
  // keep only basename, strip any path components
  const base = name.split('\\').pop()!.split('/').pop()!;
  // allow letters, numbers, dot, dash, underscore; collapse others to dash
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
  // limit length
  const limited = cleaned.slice(0, 128) || fallback;
  return limited;
}


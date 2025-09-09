import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { assertJsonContentType, verifySameOrigin, jsonError } from '@/lib/security';
import { models as allowedModels } from '@/lib/models/models.generated';

// Route for updating selected-model cookie because setting in an action causes a refresh
export async function POST(request: NextRequest) {
  try {
    const originCheck = verifySameOrigin(request);
    if (!originCheck.ok) return jsonError(403, 'Forbidden: origin not allowed');
    if (!assertJsonContentType(request)) {
      return jsonError(415, 'Unsupported Media Type: application/json required');
    }
    const { model } = await request.json();

    if (!model || typeof model !== 'string') {
      return jsonError(400, 'Invalid model parameter');
    }

    if (!allowedModels.includes(model as (typeof allowedModels)[number])) {
      return jsonError(400, 'Unknown model id');
    }

    const cookieStore = await cookies();
    cookieStore.set('chat-model', model, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(500, 'Failed to set cookie');
  }
}

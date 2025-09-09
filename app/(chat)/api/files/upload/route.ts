import { NextResponse } from 'next/server';
import {
  verifySameOrigin,
  assertMultipartFormData,
  tooLargeByContentLength,
  jsonError,
  sanitizeFilename,
} from '@/lib/security';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { uploadFile, extractFilenameFromUrl } from '@/lib/blob';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    .refine(
      (file) =>
        ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type),
      {
        message: 'File type should be JPEG, PNG, or PDF',
      },
    ),
});

export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return jsonError(403, 'Forbidden: origin not allowed');
  if (!assertMultipartFormData(request)) {
    return jsonError(415, 'Unsupported Media Type: multipart/form-data required');
  }
  if (tooLargeByContentLength(request as Request, 6 * 1024 * 1024)) {
    return jsonError(413, 'Payload Too Large');
  }
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((issue) => issue.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = sanitizeFilename((formData.get('file') as File).name || 'upload.bin');
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await uploadFile(filename, fileBuffer);

      // Remove prefix from pathname in response
      const cleanFilename = extractFilenameFromUrl(data.pathname);

      return NextResponse.json({
        ...data,
        pathname: cleanFilename || filename,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}

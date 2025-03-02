/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    // Parse FormData directly from the request
    const formData = await req.formData();

    // Extract the file from the FormData
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to a buffer and then to a readable stream
    const buffer = await file.arrayBuffer();
    const stream = Readable.from(Buffer.from(buffer));

    // Upload to Cloudinary
    const result = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: 'your-folder-name' },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result.secure_url);
        }
      );
      stream.pipe(uploadStream);
    });

    return NextResponse.json({ url: result });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed!' }, { status: 500 });
  }
}
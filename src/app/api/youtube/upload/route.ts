// app/api/youtube/upload/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { uploadVideo } from '@/server/services/youtube-service';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
        headers: await headers() // you need to pass the headers object.
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the form data
    const formData = await req.formData();
    
    // Get video file
    const videoFile = formData.get('video') as File;
    if (!videoFile) {
      return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
    }
    
    // Get optional thumbnail
    const thumbnailFile = formData.get('thumbnail') as File | null;
    
    // Get metadata
    const metadataStr = formData.get('metadata') as string;
    if (!metadataStr) {
      return NextResponse.json({ error: 'Metadata is required' }, { status: 400 });
    }
    
    // Get metadata with type safety
    let metadata: { 
      title?: string; 
      description?: string; 
      tags?: string[]; 
      privacyStatus?: 'private' | 'public' | 'unlisted' 
    };
    try {
      metadata = JSON.parse(metadataStr) as {
        title?: string;
        description?: string;
        tags?: string[];
        privacyStatus?: 'private' | 'public' | 'unlisted';
      };
    } catch {
      return NextResponse.json({ error: 'Invalid metadata format' }, { status: 400 });
    }
    
    const { title, description, tags, privacyStatus } = metadata;
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Convert files to buffers
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    const thumbnailBuffer = thumbnailFile ? Buffer.from(await thumbnailFile.arrayBuffer()) : null;
    
    // Upload the video using your service function
    const result = await uploadVideo({
      videoBuffer,
      title,
      description: description ?? '',
      tags: tags ?? [],
      privacyStatus: privacyStatus ?? 'private',
      userId,
      thumbnailBuffer
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in YouTube upload API route:', error);
    return NextResponse.json(
      { error: 'Failed to upload video', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
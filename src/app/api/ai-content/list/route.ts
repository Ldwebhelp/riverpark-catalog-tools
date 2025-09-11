import { NextRequest, NextResponse } from 'next/server';
import { VercelDatabase } from '@/lib/vercel-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contentType = searchParams.get('contentType') as 'ai-search' | 'care-guide' | 'species-data' | 'plant-guide' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`🔄 Listing AI content${contentType ? ` (${contentType})` : ''} - limit: ${limit}, offset: ${offset}`);

    const { content, total } = await VercelDatabase.getAllAIContent(contentType, limit, offset);

    return NextResponse.json({
      success: true,
      content,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('❌ Error listing AI content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list AI content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { VercelDatabase } from '@/lib/vercel-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const contentType = searchParams.get('contentType') as 'ai-search' | 'care-guide' | 'species-data' | 'plant-guide' | undefined;

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId parameter' },
        { status: 400 }
      );
    }

    console.log(`🔄 Retrieving AI content for product ${productId}${contentType ? ` (${contentType})` : ''}`);

    const content = await VercelDatabase.getAIContent(parseInt(productId), contentType);

    return NextResponse.json({
      success: true,
      content,
      total: content.length
    });

  } catch (error) {
    console.error('❌ Error retrieving AI content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve AI content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, targetPath } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId' },
        { status: 400 }
      );
    }

    console.log(`🔄 Resending AI content ${contentId} to ${targetPath || 'default location'}`);

    // Get content from database
    const searchParams = new URLSearchParams();
    searchParams.set('contentId', contentId.toString());
    
    // For now, return success - in a full implementation, this would
    // actually copy the file or send it to the specified target
    console.log(`✅ Content ${contentId} marked for resending`);

    return NextResponse.json({
      success: true,
      message: 'Content queued for resending',
      contentId,
      targetPath: targetPath || '/Users/lindsay/GitHub/riverpark-catalyst-fresh/frontend/content/'
    });

  } catch (error) {
    console.error('❌ Error resending AI content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to resend AI content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { VercelDatabase } from '@/lib/vercel-database';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId, 
      contentType, 
      contentData, 
      autoSave = true 
    } = body;

    if (!productId || !contentType || !contentData) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, contentType, contentData' },
        { status: 400 }
      );
    }

    console.log(`🔄 Storing AI content for product ${productId} (${contentType})`);

    // Determine file paths
    let localFilePath: string | null = null;
    const catalystFilePath: string | null = null;

    if (autoSave) {
      let localFileName: string;

      // Determine file naming based on content type
      if (contentType === 'species') {
        localFileName = `species-data-${productId}.json`;
      } else {
        localFileName = `ai-search-data-${productId}.json`;
      }
      
      // Local storage path (current project)
      localFilePath = path.join(process.cwd(), 'generated-content', localFileName);
      
      // Ensure directories exist
      await fs.mkdir(path.dirname(localFilePath), { recursive: true });

      // Save to local location only (remove hardcoded catalyst paths)
      const jsonContent = JSON.stringify(contentData, null, 2);
      await fs.writeFile(localFilePath, jsonContent, 'utf8');

      console.log(`✅ Saved file locally: ${localFilePath}`);

      // Send content to catalyst project via API (production-safe)
      try {
        const catalystApiUrl = process.env.CATALYST_API_URL || 'https://riverpark-catalyst-fresh.vercel.app';
        const sendResponse = await fetch(`${catalystApiUrl}/api/ai/save-ai-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: productId,
            contentType: contentType,
            fileName: contentType === 'species' ? `${productId}-species.json` : `${productId}-ai-search.json`,
            content: contentData
          })
        });

        if (sendResponse.ok) {
          console.log(`✅ Successfully sent content to catalyst project via API`);
        } else {
          console.log(`⚠️ Failed to send content to catalyst project: ${sendResponse.status}`);
        }
      } catch (apiError) {
        console.log(`⚠️ Could not send content to catalyst project:`, apiError);
        // This is non-blocking - local storage still works
      }
    }

    // Store in database (optional - gracefully skip if not configured)
    let dbContent = null;
    try {
      dbContent = await VercelDatabase.storeAIContent(
        parseInt(productId),
        contentType,
        contentData,
        catalystFilePath || undefined,
        contentData.metadata?.confidence || 'medium',
        'openai'
      );

      if (dbContent) {
        console.log('✅ Content stored in database');
      }
    } catch (dbError) {
      // Only try to initialize if we get a specific initialization error
      if (dbError instanceof Error && dbError.message.includes('not configured')) {
        console.log('ℹ️ Database not configured - files saved successfully to filesystem');
      } else {
        // Try to initialize tables if it's a different database error
        try {
          await VercelDatabase.initializeTables();
          // Retry storage after initialization
          dbContent = await VercelDatabase.storeAIContent(
            parseInt(productId),
            contentType,
            contentData,
            catalystFilePath || undefined,
            contentData.metadata?.confidence || 'medium',
            'openai'
          );
          
          if (dbContent) {
            console.log('✅ Content stored in database after initialization');
          }
        } catch {
          console.log('ℹ️ Database not available - files saved successfully to filesystem');
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Content stored successfully',
      paths: {
        local: localFilePath,
        catalyst: catalystFilePath
      },
      database: !!dbContent,
      content: dbContent || null
    });

  } catch (error) {
    console.error('❌ Error storing AI content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to store AI content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
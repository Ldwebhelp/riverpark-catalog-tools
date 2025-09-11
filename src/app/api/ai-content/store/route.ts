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
    let catalystFilePath: string | null = null;

    if (autoSave) {
      let localFileName: string;
      let catalystFileName: string;
      let catalystSubDir: string;

      // Determine file naming based on content type
      if (contentType === 'species') {
        localFileName = `species-data-${productId}.json`;
        catalystFileName = `${productId}-species.json`;
        catalystSubDir = 'species';
      } else {
        localFileName = `ai-search-data-${productId}.json`;
        catalystFileName = `${productId}-ai-search.json`;
        catalystSubDir = 'ai-search';
      }
      
      // Local storage path (current project)
      localFilePath = path.join(process.cwd(), 'generated-content', localFileName);
      
      // Catalyst project path - using the correct directory and naming convention
      const catalystBasePath = '/Users/lindsay/GitHub/riverpark-catalyst-fresh';
      catalystFilePath = path.join(catalystBasePath, 'frontend', 'content', catalystSubDir, catalystFileName);

      // Ensure directories exist and save files
      const jsonContent = JSON.stringify(contentData, null, 2);
      const fileSavePromises = [];
      
      // Always save local file
      await fs.mkdir(path.dirname(localFilePath), { recursive: true });
      fileSavePromises.push(fs.writeFile(localFilePath, jsonContent, 'utf8'));
      
      // Only save to Catalyst if the directory exists (local development)
      try {
        await fs.mkdir(path.dirname(catalystFilePath), { recursive: true });
        fileSavePromises.push(fs.writeFile(catalystFilePath, jsonContent, 'utf8'));
        console.log(`✅ Saved files to:`);
        console.log(`   Local: ${localFilePath}`);
        console.log(`   Catalyst: ${catalystFilePath}`);
      } catch (catalystError) {
        console.log(`ℹ️ Catalyst path not available (production environment)`);
        console.log(`✅ Saved local file: ${localFilePath}`);
        catalystFilePath = null; // Clear the path since it couldn't be saved
      }
      
      await Promise.all(fileSavePromises);
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
        } catch (initError) {
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
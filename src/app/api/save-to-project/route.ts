import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { productId, content, filename } = await req.json();

    if (!productId || !content || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, content, filename' },
        { status: 400 }
      );
    }

    // Define the target directory in riverpark-catalyst-fresh project
    // Assumes the projects are in the same parent directory
    const projectRoot = process.cwd();
    const parentDir = path.dirname(projectRoot);
    const targetDir = path.join(parentDir, 'riverpark-catalyst-fresh', 'frontend', 'content', 'care-guides');
    
    // Ensure the target directory exists
    try {
      await fs.access(targetDir);
    } catch {
      // Create the directory if it doesn't exist
      await fs.mkdir(targetDir, { recursive: true });
    }

    // Create the full file path
    const filePath = path.join(targetDir, filename);
    
    // Write the JSON content to the file
    await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');

    // Also save a metadata file for tracking
    const metadataPath = path.join(targetDir, `${productId}_metadata.json`);
    const metadata = {
      productId,
      filename,
      savedAt: new Date().toISOString(),
      filePath: filePath,
      generatedBy: 'riverpark-catalog-tools'
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      message: 'File saved successfully to riverpark-catalyst-fresh project',
      filePath: filePath,
      productId: productId
    });

  } catch (error) {
    console.error('Error saving file to project:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save file to project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
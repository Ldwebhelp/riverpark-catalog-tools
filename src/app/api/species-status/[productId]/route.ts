import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ productId: string }>;

export async function GET(request: NextRequest, props: { params: Params }) {
  const params = await props.params;
  const { productId } = params;
  
  try {
    // Check if species file exists in riverpark-catalyst-fresh
    const response = await fetch(`https://riverpark-catalyst-fresh.vercel.app/api/species-check/${productId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // If the API doesn't exist yet, we'll simulate the response
      if (response.status === 404) {
        return NextResponse.json({
          exists: false,
          productId,
          status: 'no-file',
          message: 'Species file not found'
        });
      }
      
      throw new Error(`Species check failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      exists: data.exists || false,
      productId,
      status: data.exists ? 'created' : 'no-file',
      lastModified: data.lastModified,
      filePath: data.filePath,
      fileSize: data.fileSize
    });

  } catch (error) {
    console.error(`Error checking species status for product ${productId}:`, error);
    
    // Return error status
    return NextResponse.json({
      exists: false,
      productId,
      status: 'errored',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check species file status'
    });
  }
}

// POST endpoint to update species status manually
export async function POST(request: NextRequest, props: { params: Params }) {
  const params = await props.params;
  const { productId } = params;
  
  try {
    const body = await request.json();
    const { status, lastGenerated, error, filePath } = body;
    
    // For now, we'll just return the updated status
    // In a full implementation, this would update a database
    return NextResponse.json({
      productId,
      status,
      lastGenerated,
      error,
      filePath,
      updated: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to update species status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
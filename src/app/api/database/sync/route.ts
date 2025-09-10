import { NextResponse } from 'next/server';
import { VercelDatabase } from '@/lib/vercel-database';
import { enhancedProductDiscovery } from '@/lib/enhanced-product-discovery';

export async function POST() {
  try {
    console.log('🔄 Starting database sync...');

    // Get all products from enhanced discovery
    const result = await enhancedProductDiscovery.discoverAllFishProducts({
      sortBy: 'name',
      sortOrder: 'asc'
    });

    console.log(`📦 Found ${result.products.length} fish products to sync`);

    // Sync products to database
    await VercelDatabase.syncProducts(result.products);

    // Get updated analytics
    const analytics = await VercelDatabase.getAnalytics();

    console.log('✅ Database sync completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Products synced to database successfully',
      syncedCount: result.products.length,
      source: result.source,
      analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database sync failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync products to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get cached products from database
    const products = await VercelDatabase.getCachedProducts();
    const analytics = await VercelDatabase.getAnalytics();

    return NextResponse.json({
      success: true,
      products: products.slice(0, 10), // Return first 10 for preview
      totalCount: products.length,
      analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get cached products',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
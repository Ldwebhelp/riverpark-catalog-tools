import { NextResponse } from 'next/server';
import { VercelDatabase } from '@/lib/vercel-database';
import { createBigCommerceClient } from '@/lib/bigcommerce-direct';

export async function POST() {
  try {
    console.log('🔄 Starting BigCommerce to Database sync...');

    // Initialize BigCommerce client
    const bigcommerceClient = createBigCommerceClient();
    
    if (!bigcommerceClient) {
      return NextResponse.json({
        success: false,
        error: 'BigCommerce credentials not configured',
        syncedCount: 0
      }, { status: 400 });
    }

    // Test connection first
    const connectionTest = await bigcommerceClient.testConnection();
    if (!connectionTest.connected) {
      return NextResponse.json({
        success: false,
        error: `BigCommerce connection failed: ${connectionTest.error}`,
        syncedCount: 0
      }, { status: 503 });
    }

    // Initialize database tables if needed
    await VercelDatabase.initializeTables();

    // Fetch all products from BigCommerce
    const products = await bigcommerceClient.getAllProducts();
    
    console.log(`📦 Found ${products.length} products from BigCommerce`);

    // Sync products to database
    await VercelDatabase.syncProducts(products);

    // Get updated analytics
    const analytics = await VercelDatabase.getAnalytics();

    console.log('✅ Database sync completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Products synced from BigCommerce to database successfully',
      syncedCount: products.length,
      source: 'bigcommerce-direct',
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
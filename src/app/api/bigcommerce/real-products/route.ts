import { NextRequest, NextResponse } from 'next/server';
import { createBigCommerceClient } from '@/lib/bigcommerce-direct';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching real BigCommerce products...');

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // Create BigCommerce client
    const bigCommerceClient = createBigCommerceClient();
    
    if (!bigCommerceClient) {
      return NextResponse.json(
        { 
          error: 'BigCommerce credentials not configured',
          details: 'Please check BIGCOMMERCE_API_URL and BIGCOMMERCE_ACCESS_TOKEN environment variables'
        }, 
        { status: 500 }
      );
    }

    // Test connection first
    const connectionTest = await bigCommerceClient.testConnection();
    if (!connectionTest.connected) {
      return NextResponse.json(
        { 
          error: 'Failed to connect to BigCommerce API',
          details: connectionTest.error 
        }, 
        { status: 500 }
      );
    }

    // Fetch all products
    let products = await bigCommerceClient.getAllProducts();

    // Apply category filtering if specified
    if (category) {
      products = products.filter(product => 
        product.categories.includes(category)
      );
      console.log(`🏷️ Filtered to category "${category}": ${products.length} products`);
    }

    console.log(`✅ Returning ${products.length} products`);

    return NextResponse.json({
      data: products,
      meta: {
        total: products.length,
        source: 'bigcommerce_api',
        connection_status: 'connected',
        category: category || 'all'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching real BigCommerce products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products from BigCommerce API', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}
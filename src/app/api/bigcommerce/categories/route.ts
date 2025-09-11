import { NextResponse } from 'next/server';
import { createBigCommerceClient } from '@/lib/bigcommerce-direct';

export async function GET() {
  try {
    console.log('🏷️ Fetching all BigCommerce categories from real API...');

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

    // Fetch all products to extract categories
    const products = await bigCommerceClient.getAllProducts();
    
    // Extract all unique categories
    const categorySet = new Set<string>();
    const categoryCounts: { [key: string]: number } = {};
    
    products.forEach(product => {
      product.categories.forEach(category => {
        categorySet.add(category);
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });

    // Convert to sorted array with counts
    const categories = Array.from(categorySet)
      .map(category => ({
        name: category,
        count: categoryCounts[category]
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    console.log(`✅ Found ${categories.length} unique categories`);

    return NextResponse.json({
      data: categories,
      meta: {
        pagination: {
          total: categories.length,
          count: categories.length,
          per_page: categories.length,
          current_page: 1,
          total_pages: 1
        },
        source: 'bigcommerce_api',
        totalProducts: products.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching BigCommerce categories:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories from BigCommerce API', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}
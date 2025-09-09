import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('BigCommerce products request initiated - using JSON database');

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const keyword = searchParams.get('keyword');

    let products = await Database.getBigCommerceProducts();
    
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId);
      products = products.filter(product => 
        product.categories && product.categories.includes(categoryIdNum)
      );
    }
    
    if (keyword) {
      const searchTerm = keyword.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm)
      );
    }

    console.log('BigCommerce products response:', products.length, 'products found');

    return NextResponse.json({
      data: products,
      meta: {
        pagination: {
          total: products.length,
          count: products.length,
          per_page: products.length,
          current_page: 1,
          total_pages: 1,
          links: {
            current: 'page=1'
          }
        },
        api_type: 'json_database'
      }
    });

  } catch (error) {
    console.error('Error fetching BigCommerce products from database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products from BigCommerce database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}
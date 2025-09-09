import { NextRequest, NextResponse } from 'next/server';
import { createBigCommerceClient } from '@/lib/bigcommerce-client';

export async function GET(request: NextRequest) {
  try {
    const client = createBigCommerceClient();
    
    if (!client) {
      console.error('BigCommerce client not created - missing credentials');
      return NextResponse.json(
        { error: 'BigCommerce API credentials not configured. Please check BIGCOMMERCE_ACCESS_TOKEN and BIGCOMMERCE_API_URL environment variables.' }, 
        { status: 500 }
      );
    }

    console.log('BigCommerce products API request initiated');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const categoryId = searchParams.get('categoryId');
    const keyword = searchParams.get('keyword');
    const brandId = searchParams.get('brandId');
    const isVisible = searchParams.get('isVisible');
    const includeSubcategories = searchParams.get('includeSubcategories') === 'true';

    // If requesting products from category and subcategories
    if (categoryId && includeSubcategories) {
      const result = await client.getProductsFromCategoryAndSubcategories(
        parseInt(categoryId),
        page,
        limit
      );
      
      return NextResponse.json({
        data: result.products,
        meta: {
          pagination: result.pagination
        },
        categoryTree: result.categoryTree
      });
    }

    // Regular product search with filters
    const filters: any = {};
    
    if (categoryId) {
      filters.categoryId = parseInt(categoryId);
    }
    
    if (keyword) {
      filters.keyword = keyword;
    }
    
    if (brandId) {
      filters.brandId = parseInt(brandId);
    }
    
    if (isVisible !== null) {
      filters.isVisible = isVisible === 'true';
    }

    const products = await client.getProducts(page, limit, filters);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching BigCommerce products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products from BigCommerce', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
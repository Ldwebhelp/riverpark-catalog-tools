import { NextRequest, NextResponse } from 'next/server';
import { createStorefrontClient } from '@/lib/bigcommerce-storefront';

export async function GET(request: NextRequest) {
  try {
    const client = createStorefrontClient();
    
    if (!client) {
      console.error('BigCommerce Storefront client not created - missing credentials');
      return NextResponse.json(
        { error: 'BigCommerce Storefront API credentials not configured. Please check BIGCOMMERCE_STOREFRONT_TOKEN environment variable.' }, 
        { status: 500 }
      );
    }

    console.log('BigCommerce Storefront products API request initiated');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const categoryId = searchParams.get('categoryId');
    const keyword = searchParams.get('keyword');

    // Calculate cursor pagination from page number
    // Note: GraphQL uses cursor-based pagination, not offset-based
    let after: string | undefined;
    if (page > 1) {
      // For simplicity, we'll use the page number as a cursor approximation
      // In a real implementation, you'd store and pass actual cursors
      after = btoa(`cursor:${(page - 1) * limit}`);
    }

    // Build filters for GraphQL query
    const filters: any = {};
    
    if (categoryId) {
      filters.categoryEntityId = parseInt(categoryId);
    }
    
    if (keyword) {
      filters.searchTerm = keyword;
    }

    console.log('Fetching products with filters:', filters);

    const response = await client.getProducts(limit, after, filters);
    const products = response.data.site.products;

    console.log('GraphQL Products response:', products.edges.length, 'products found');

    // Convert GraphQL response to expected format
    const convertedProducts = products.edges.map((edge: any) => ({
      id: edge.node.entityId,
      name: edge.node.name,
      type: 'physical',
      sku: edge.node.sku,
      description: edge.node.description,
      price: edge.node.prices.price.value,
      sale_price: edge.node.prices.salePrice?.value || 0,
      inventory_level: edge.node.inventory.aggregated?.availableToSell || 0,
      is_visible: true, // Storefront API only returns visible products
      categories: edge.node.categories.edges.map((catEdge: any) => catEdge.node.entityId),
      brand_id: null, // Would need to add brand to GraphQL query
      images: edge.node.defaultImage ? [edge.node.defaultImage] : [],
      primary_image: edge.node.defaultImage,
      date_modified: new Date().toISOString(), // GraphQL doesn't return dates by default
      date_created: new Date().toISOString(),
    }));

    // Simulate REST API pagination response
    const totalPages = products.pageInfo.hasNextPage ? page + 1 : page;
    const pagination = {
      total: convertedProducts.length * totalPages, // Approximate
      count: convertedProducts.length,
      per_page: limit,
      current_page: page,
      total_pages: totalPages,
      links: {
        current: `page=${page}`,
        next: products.pageInfo.hasNextPage ? `page=${page + 1}` : undefined,
        previous: page > 1 ? `page=${page - 1}` : undefined,
      }
    };

    return NextResponse.json({
      data: convertedProducts,
      meta: {
        pagination,
        api_type: 'graphql_storefront'
      }
    });

  } catch (error) {
    console.error('Error fetching BigCommerce products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products from BigCommerce Storefront API', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}
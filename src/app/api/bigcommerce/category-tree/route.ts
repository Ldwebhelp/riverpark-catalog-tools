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

    console.log('Attempting to fetch category tree from BigCommerce Storefront API...');

    const response = await client.getCategoryTree();
    const categoryTree = response.data.site.categoryTree;
    
    console.log('GraphQL Categories response:', categoryTree.length, 'categories found');

    // Convert GraphQL response to expected format
    const convertCategory = (category: any): any => ({
      id: category.entityId,
      parent_id: 0, // GraphQL already provides hierarchical structure
      name: category.name,
      description: category.description,
      is_visible: true,
      sort_order: category.entityId,
      children: category.children.edges.map((edge: any) => convertCategory(edge.node))
    });

    const tree = categoryTree.map(convertCategory);

    return NextResponse.json({
      data: tree,
      meta: {
        total_categories: categoryTree.length,
        api_type: 'graphql_storefront'
      }
    });
  } catch (error) {
    console.error('Error fetching BigCommerce category tree:', error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch category tree from BigCommerce Storefront API',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
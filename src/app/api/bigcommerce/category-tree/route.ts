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

    console.log('Attempting to fetch category tree from BigCommerce...');

    // Try the modern category trees approach first
    let categoryTree;
    try {
      const trees = await client.getCategoryTrees();
      console.log('Category trees response:', trees);
      
      if (trees.data && trees.data.length > 0) {
        // Get categories from the first tree (usually the main storefront)
        const firstTreeId = trees.data[0].id;
        console.log('Getting categories from tree ID:', firstTreeId);
        const categoriesResponse = await client.getCategoriesFromTree(firstTreeId);
        categoryTree = categoriesResponse.data;
        console.log('Categories from tree:', categoryTree.length, 'categories found');
      } else {
        throw new Error('No category trees found');
      }
    } catch (treeError) {
      console.warn('Category trees API failed, falling back to legacy categories API:', treeError);
      
      // Fallback to legacy categories endpoint
      const response = await client.getCategories(1, 250);
      categoryTree = response.data;
      console.log('Legacy categories response:', categoryTree.length, 'categories found');
    }

    // Build hierarchical structure
    const buildTree = (parentId: number = 0): any[] => {
      return categoryTree
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }))
        .sort((a, b) => a.sort_order - b.sort_order);
    };

    const tree = buildTree(0);

    return NextResponse.json({
      data: tree,
      meta: {
        total_categories: categoryTree.length
      }
    });
  } catch (error) {
    console.error('Error fetching BigCommerce category tree:', error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch category tree from BigCommerce',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
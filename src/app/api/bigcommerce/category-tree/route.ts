import { NextRequest, NextResponse } from 'next/server';
import { createBigCommerceClient } from '@/lib/bigcommerce-client';

export async function GET(request: NextRequest) {
  try {
    const client = createBigCommerceClient();
    
    if (!client) {
      return NextResponse.json(
        { error: 'BigCommerce API credentials not configured' }, 
        { status: 500 }
      );
    }

    const categoryTree = await client.getCategoryTree();

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
    return NextResponse.json(
      { error: 'Failed to fetch category tree from BigCommerce' }, 
      { status: 500 }
    );
  }
}
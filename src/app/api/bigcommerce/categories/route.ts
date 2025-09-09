import { NextResponse } from 'next/server';
import { Database } from '@/lib/database';

export async function GET() {
  try {
    console.log('BigCommerce categories request initiated - using JSON database');

    const categories = await Database.getBigCommerceCategories();
    
    // Convert to expected format for compatibility
    const formattedCategories = {
      data: categories,
      meta: {
        pagination: {
          total: categories.length,
          count: categories.length,
          per_page: categories.length,
          current_page: 1,
          total_pages: 1
        }
      }
    };
    
    console.log('BigCommerce categories response:', categories.length, 'categories found');
    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching BigCommerce categories from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories from BigCommerce database' }, 
      { status: 500 }
    );
  }
}
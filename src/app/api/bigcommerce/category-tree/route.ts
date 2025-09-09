import { NextResponse } from 'next/server';
import { Database } from '@/lib/database';

export async function GET() {
  try {
    console.log('BigCommerce category tree request initiated - using JSON database');

    const categories = await Database.getBigCommerceCategories();
    
    console.log('BigCommerce categories response:', categories.length, 'categories found');

    return NextResponse.json({
      data: categories,
      meta: {
        total_categories: categories.length,
        api_type: 'json_database'
      }
    });
  } catch (error) {
    console.error('Error fetching BigCommerce category tree from database:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch category tree from BigCommerce database',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
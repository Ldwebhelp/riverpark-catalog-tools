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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '250');

    const categories = await client.getCategories(page, limit);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching BigCommerce categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories from BigCommerce' }, 
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Riverpark Catalog Tools',
      version: '1.0.0',
      features: {
        speciesGenerator: true,
        careGuideGenerator: true,
        database: 'localStorage (development)',
        speciesDatabase: '50+ species'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}
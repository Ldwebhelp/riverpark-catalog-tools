import { NextResponse } from 'next/server';
import { VercelDatabase } from '@/lib/vercel-database';

export async function POST() {
  try {
    console.log('🔄 Initializing Vercel database...');

    // Initialize all database tables
    await VercelDatabase.initializeTables();

    // Get current analytics
    const analytics = await VercelDatabase.getAnalytics();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get database analytics and status
    const analytics = await VercelDatabase.getAnalytics();
    
    return NextResponse.json({
      success: true,
      analytics,
      status: 'Database is operational',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Database check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
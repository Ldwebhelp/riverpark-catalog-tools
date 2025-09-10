/**
 * BigCommerce Sync API Endpoint
 * Fetches products from BigCommerce and saves to static JSON files
 */

import { NextResponse } from 'next/server';
import { createBigCommerceClient } from '@/lib/bigcommerce-direct';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    console.log('🔄 Starting BigCommerce sync to static files...');

    // Initialize BigCommerce client
    const bigcommerceClient = createBigCommerceClient();
    
    if (!bigcommerceClient) {
      return NextResponse.json({
        success: false,
        error: 'BigCommerce credentials not configured. Please set BIGCOMMERCE_STORE_URL and BIGCOMMERCE_ACCESS_TOKEN environment variables.',
        productCount: 0,
        syncTime: new Date().toISOString(),
        source: 'bigcommerce'
      });
    }

    // Test connection first
    const connectionTest = await bigcommerceClient.testConnection();
    if (!connectionTest.connected) {
      return NextResponse.json({
        success: false,
        error: `BigCommerce connection failed: ${connectionTest.error}`,
        productCount: 0,
        syncTime: new Date().toISOString(),
        source: 'bigcommerce'
      });
    }

    // Fetch all products
    const products = await bigcommerceClient.getAllProducts();
    
    // Get fish products only
    const fishProducts = await bigcommerceClient.getFishProducts();
    
    // Extract unique categories
    const categories = Array.from(
      new Set(products.flatMap(product => product.categories))
    ).sort();

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write products to static JSON files
    const productsFilePath = path.join(dataDir, 'products.json');
    const categoriesFilePath = path.join(dataDir, 'categories.json');
    const syncMetaFilePath = path.join(dataDir, 'sync-metadata.json');

    // Save all products
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
    
    // Save categories
    fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2));
    
    // Save sync metadata
    const syncMetadata = {
      lastSync: new Date().toISOString(),
      productCount: products.length,
      fishProductCount: fishProducts.length,
      categoryCount: categories.length,
      source: 'bigcommerce',
      nextSyncDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      storeInfo: connectionTest.storeInfo
    };
    
    fs.writeFileSync(syncMetaFilePath, JSON.stringify(syncMetadata, null, 2));

    console.log(`✅ Successfully synced ${products.length} products to static files`);
    console.log(`🐟 Found ${fishProducts.length} fish products`);
    console.log(`📂 Saved ${categories.length} categories`);

    return NextResponse.json({
      success: true,
      productCount: products.length,
      fishProductCount: fishProducts.length,
      categoryCount: categories.length,
      syncTime: new Date().toISOString(),
      source: 'bigcommerce',
      filesCreated: [
        'public/data/products.json',
        'public/data/categories.json', 
        'public/data/sync-metadata.json'
      ]
    });

  } catch (error) {
    console.error('❌ BigCommerce sync failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
      productCount: 0,
      syncTime: new Date().toISOString(),
      source: 'bigcommerce'
    });
  }
}

export async function GET() {
  // Get current sync status
  try {
    const syncMetaPath = path.join(process.cwd(), 'public', 'data', 'sync-metadata.json');
    
    if (!fs.existsSync(syncMetaPath)) {
      return NextResponse.json({
        lastSync: null,
        productCount: 0,
        source: 'none',
        nextSyncDue: null,
        status: 'never-synced'
      });
    }

    const syncMetadata = JSON.parse(fs.readFileSync(syncMetaPath, 'utf-8'));
    
    return NextResponse.json({
      ...syncMetadata,
      status: 'synced'
    });

  } catch (error) {
    return NextResponse.json({
      lastSync: null,
      productCount: 0,
      source: 'none',
      nextSyncDue: null,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
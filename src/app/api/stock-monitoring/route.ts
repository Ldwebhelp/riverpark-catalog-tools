/**
 * Stock Monitoring API
 * Fetches current inventory levels from BigCommerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBigCommerceClient } from '@/lib/bigcommerce-direct';
import { VercelDatabase } from '@/lib/vercel-database';

export interface InventoryItem {
  productId: number;
  variantId?: number;
  sku: string;
  name: string;
  inventoryLevel: number;
  inventoryWarningLevel: number;
  isInStock: boolean;
  isVisible: boolean;
  lastUpdated: string;
}

export interface StockSummary {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  lastSyncTime: string;
}

class BigCommerceInventoryAPI {
  private client: any;

  constructor() {
    this.client = createBigCommerceClient();
  }

  private getHeaders(): Record<string, string> {
    return {
      'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN!,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Get inventory levels for all products
   */
  async getAllInventoryLevels(): Promise<InventoryItem[]> {
    if (!this.client) {
      throw new Error('BigCommerce client not configured');
    }

    try {
      const inventoryItems: InventoryItem[] = [];
      let page = 1;
      const limit = 250;

      while (true) {
        console.log(`📦 Fetching inventory page ${page}...`);

        const response = await fetch(
          `${process.env.BIGCOMMERCE_API_URL}catalog/products?limit=${limit}&page=${page}&include=variants&include_fields=id,sku,name,inventory_level,inventory_warning_level,is_visible,date_modified,variants`,
          {
            headers: this.getHeaders()
          }
        );

        if (!response.ok) {
          throw new Error(`BigCommerce API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const products = data.data || [];

        if (products.length === 0) {
          break;
        }

        for (const product of products) {
          // Handle main product inventory
          if (product.inventory_level !== undefined) {
            inventoryItems.push({
              productId: product.id,
              sku: product.sku || `product-${product.id}`,
              name: product.name,
              inventoryLevel: product.inventory_level || 0,
              inventoryWarningLevel: product.inventory_warning_level || 0,
              isInStock: (product.inventory_level || 0) > 0,
              isVisible: product.is_visible,
              lastUpdated: product.date_modified || new Date().toISOString()
            });
          }

          // Handle variant inventory if product has variants
          if (product.variants && product.variants.length > 0) {
            for (const variant of product.variants) {
              if (variant.inventory_level !== undefined) {
                inventoryItems.push({
                  productId: product.id,
                  variantId: variant.id,
                  sku: variant.sku || `variant-${variant.id}`,
                  name: `${product.name} - ${variant.option_values?.map((ov: any) => ov.label).join(', ') || 'Variant'}`,
                  inventoryLevel: variant.inventory_level || 0,
                  inventoryWarningLevel: variant.inventory_warning_level || 0,
                  isInStock: (variant.inventory_level || 0) > 0,
                  isVisible: product.is_visible,
                  lastUpdated: variant.date_modified || product.date_modified || new Date().toISOString()
                });
              }
            }
          }
        }

        console.log(`✅ Page ${page}: ${products.length} products processed (Total items: ${inventoryItems.length})`);

        if (products.length < limit) {
          break;
        }

        page++;
      }

      console.log(`🎉 Successfully fetched inventory for ${inventoryItems.length} items`);
      return inventoryItems;

    } catch (error) {
      console.error('❌ Failed to fetch inventory levels:', error);
      throw error;
    }
  }

  /**
   * Get inventory levels for specific products
   */
  async getProductInventory(productIds: number[]): Promise<InventoryItem[]> {
    if (!this.client) {
      throw new Error('BigCommerce client not configured');
    }

    try {
      const inventoryItems: InventoryItem[] = [];

      // Fetch products in batches to avoid URL length limits
      const batchSize = 50;
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        const idFilter = batch.map(id => `id:in=${id}`).join('&');

        const response = await fetch(
          `${process.env.BIGCOMMERCE_API_URL}catalog/products?${idFilter}&include=variants&include_fields=id,sku,name,inventory_level,inventory_warning_level,is_visible,date_modified,variants`,
          {
            headers: this.getHeaders()
          }
        );

        if (!response.ok) {
          throw new Error(`BigCommerce API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const products = data.data || [];

        for (const product of products) {
          if (product.inventory_level !== undefined) {
            inventoryItems.push({
              productId: product.id,
              sku: product.sku || `product-${product.id}`,
              name: product.name,
              inventoryLevel: product.inventory_level || 0,
              inventoryWarningLevel: product.inventory_warning_level || 0,
              isInStock: (product.inventory_level || 0) > 0,
              isVisible: product.is_visible,
              lastUpdated: product.date_modified || new Date().toISOString()
            });
          }

          if (product.variants && product.variants.length > 0) {
            for (const variant of product.variants) {
              if (variant.inventory_level !== undefined) {
                inventoryItems.push({
                  productId: product.id,
                  variantId: variant.id,
                  sku: variant.sku || `variant-${variant.id}`,
                  name: `${product.name} - ${variant.option_values?.map((ov: any) => ov.label).join(', ') || 'Variant'}`,
                  inventoryLevel: variant.inventory_level || 0,
                  inventoryWarningLevel: variant.inventory_warning_level || 0,
                  isInStock: (variant.inventory_level || 0) > 0,
                  isVisible: product.is_visible,
                  lastUpdated: variant.date_modified || product.date_modified || new Date().toISOString()
                });
              }
            }
          }
        }
      }

      return inventoryItems;

    } catch (error) {
      console.error('❌ Failed to fetch product inventory:', error);
      throw error;
    }
  }

  /**
   * Generate stock summary
   */
  generateStockSummary(inventoryItems: InventoryItem[]): StockSummary {
    const visibleItems = inventoryItems.filter(item => item.isVisible);

    return {
      totalProducts: visibleItems.length,
      inStockProducts: visibleItems.filter(item => item.isInStock).length,
      outOfStockProducts: visibleItems.filter(item => !item.isInStock).length,
      lowStockProducts: visibleItems.filter(item =>
        item.isInStock && item.inventoryLevel <= item.inventoryWarningLevel && item.inventoryWarningLevel > 0
      ).length,
      lastSyncTime: new Date().toISOString()
    };
  }
}

/**
 * GET /api/stock-monitoring
 * Fetch current inventory levels
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIds = searchParams.get('productIds');
    const summary = searchParams.get('summary') === 'true';

    const inventoryAPI = new BigCommerceInventoryAPI();

    let inventoryItems: InventoryItem[];

    if (productIds) {
      // Fetch specific products
      const ids = productIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      inventoryItems = await inventoryAPI.getProductInventory(ids);
    } else {
      // Fetch all products
      inventoryItems = await inventoryAPI.getAllInventoryLevels();
    }

    if (summary) {
      // Return summary only
      const stockSummary = inventoryAPI.generateStockSummary(inventoryItems);
      return NextResponse.json({
        success: true,
        summary: stockSummary
      });
    }

    // Return full inventory data
    const stockSummary = inventoryAPI.generateStockSummary(inventoryItems);

    return NextResponse.json({
      success: true,
      data: {
        inventory: inventoryItems,
        summary: stockSummary
      }
    });

  } catch (error) {
    console.error('❌ Stock monitoring API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'Failed to fetch inventory data from BigCommerce'
    }, { status: 500 });
  }
}

/**
 * POST /api/stock-monitoring
 * Manual inventory sync trigger and database operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'sync') {
      const inventoryAPI = new BigCommerceInventoryAPI();
      const inventoryItems = await inventoryAPI.getAllInventoryLevels();

      // Sync to database for historical tracking
      await VercelDatabase.syncStockData(inventoryItems);

      const summary = inventoryAPI.generateStockSummary(inventoryItems);

      return NextResponse.json({
        success: true,
        message: 'Inventory sync completed and saved to database',
        data: {
          itemsProcessed: inventoryItems.length,
          summary
        }
      });
    }

    if (action === 'getHistory') {
      const { productId, variantId } = body;

      if (!productId) {
        return NextResponse.json({
          success: false,
          error: 'Product ID is required for history retrieval'
        }, { status: 400 });
      }

      const history = await VercelDatabase.getStockHistory(productId, variantId);

      return NextResponse.json({
        success: true,
        data: { history }
      });
    }

    if (action === 'getAlerts') {
      const alerts = await VercelDatabase.getActiveStockAlerts();

      return NextResponse.json({
        success: true,
        data: { alerts }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "sync", "getHistory", or "getAlerts".'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Stock monitoring API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
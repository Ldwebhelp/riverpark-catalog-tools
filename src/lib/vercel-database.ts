/**
 * Vercel Database Integration
 * Provides persistent storage for products, species data, and notifications
 */

import { sql } from '@vercel/postgres';

// Database schema types
export interface DatabaseProduct {
  id: number;
  entity_id: number;
  name: string;
  sku: string | null;
  price: number;
  categories: string[];
  description: string | null;
  brand_name: string | null;
  is_visible: boolean;
  date_created: string;
  date_modified: string;
  last_synced: string;
  sync_source: 'bigcommerce' | 'riverpark-fresh';
}

export interface DatabaseSpeciesStatus {
  id: number;
  product_id: number;
  status: 'no-file' | 'created' | 'requires-update' | 'errored';
  file_path: string | null;
  last_generated: string | null;
  last_checked: string;
  error_message: string | null;
  generation_count: number;
  success_count: number;
  last_error: string | null;
}

export interface DatabaseNotification {
  id: number;
  notification_id: string;
  type: string;
  title: string;
  message: string;
  source: string;
  product_id: string | null;
  priority: string;
  read: boolean;
  created_at: string;
  data: any;
  actions: any[];
}

export interface DatabaseChangeLog {
  id: number;
  product_id: number;
  field_name: string;
  old_value: any;
  new_value: any;
  changed_at: string;
  detected_by: string;
}

export class VercelDatabase {
  
  /**
   * Initialize database tables if they don't exist
   */
  static async initializeTables(): Promise<void> {
    try {
      // Products table
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          entity_id INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          sku TEXT,
          price DECIMAL(10,2),
          categories TEXT[],
          description TEXT,
          brand_name TEXT,
          is_visible BOOLEAN DEFAULT true,
          date_created TIMESTAMP,
          date_modified TIMESTAMP,
          last_synced TIMESTAMP DEFAULT NOW(),
          sync_source TEXT DEFAULT 'bigcommerce',
          CONSTRAINT unique_entity_id UNIQUE(entity_id)
        )
      `;

      // Species status table
      await sql`
        CREATE TABLE IF NOT EXISTS species_status (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(entity_id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'no-file',
          file_path TEXT,
          last_generated TIMESTAMP,
          last_checked TIMESTAMP DEFAULT NOW(),
          error_message TEXT,
          generation_count INTEGER DEFAULT 0,
          success_count INTEGER DEFAULT 0,
          last_error TIMESTAMP,
          CONSTRAINT unique_product_status UNIQUE(product_id)
        )
      `;

      // Notifications table
      await sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          notification_id TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          source TEXT NOT NULL,
          product_id TEXT,
          priority TEXT NOT NULL,
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          data JSONB,
          actions JSONB
        )
      `;

      // Change log table
      await sql`
        CREATE TABLE IF NOT EXISTS change_log (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(entity_id) ON DELETE CASCADE,
          field_name TEXT NOT NULL,
          old_value JSONB,
          new_value JSONB,
          changed_at TIMESTAMP DEFAULT NOW(),
          detected_by TEXT NOT NULL
        )
      `;

      // Indexes for performance
      await sql`CREATE INDEX IF NOT EXISTS idx_products_entity_id ON products(entity_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_products_sync_source ON products(sync_source)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_species_status_product_id ON species_status(product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_species_status_status ON species_status(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_change_log_product_id ON change_log(product_id)`;

      console.log('✅ Database tables initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize database tables:', error);
      throw error;
    }
  }

  /**
   * Sync products from BigCommerce to database
   */
  static async syncProducts(products: any[]): Promise<void> {
    try {
      for (const product of products) {
        await sql`
          INSERT INTO products (
            entity_id, name, sku, price, categories, description, 
            brand_name, is_visible, date_created, date_modified, 
            last_synced, sync_source
          )
          VALUES (
            ${product.entityId}, ${product.name}, ${product.sku || null}, 
            ${product.prices?.price?.value || 0}, ${product.categories || []}, 
            ${product.description || null}, ${product.brand?.name || null}, 
            ${product.isVisible !== false}, ${product.dateCreated || null}, 
            ${product.dateModified || null}, NOW(), 'riverpark-fresh'
          )
          ON CONFLICT (entity_id) 
          DO UPDATE SET
            name = EXCLUDED.name,
            sku = EXCLUDED.sku,
            price = EXCLUDED.price,
            categories = EXCLUDED.categories,
            description = EXCLUDED.description,
            brand_name = EXCLUDED.brand_name,
            is_visible = EXCLUDED.is_visible,
            date_modified = EXCLUDED.date_modified,
            last_synced = NOW()
        `;

        // Initialize species status if not exists
        await sql`
          INSERT INTO species_status (product_id, status, last_checked)
          VALUES (${product.entityId}, 'no-file', NOW())
          ON CONFLICT (product_id) 
          DO UPDATE SET last_checked = NOW()
        `;
      }

      console.log(`✅ Synced ${products.length} products to database`);

    } catch (error) {
      console.error('❌ Failed to sync products:', error);
      throw error;
    }
  }

  /**
   * Get all cached products from database
   */
  static async getCachedProducts(): Promise<DatabaseProduct[]> {
    try {
      const { rows } = await sql`
        SELECT * FROM products 
        WHERE is_visible = true 
        ORDER BY name ASC
      `;
      return rows as DatabaseProduct[];
    } catch (error) {
      console.error('❌ Failed to get cached products:', error);
      return [];
    }
  }

  /**
   * Get species status for all products
   */
  static async getSpeciesStatuses(): Promise<Map<number, DatabaseSpeciesStatus>> {
    try {
      const { rows } = await sql`
        SELECT * FROM species_status
      `;
      
      const statusMap = new Map<number, DatabaseSpeciesStatus>();
      rows.forEach((row: any) => {
        statusMap.set(row.product_id, row as DatabaseSpeciesStatus);
      });
      
      return statusMap;
    } catch (error) {
      console.error('❌ Failed to get species statuses:', error);
      return new Map();
    }
  }

  /**
   * Update species status for a product
   */
  static async updateSpeciesStatus(
    productId: number, 
    status: 'no-file' | 'created' | 'requires-update' | 'errored',
    filePath?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      if (status === 'created') {
        await sql`
          UPDATE species_status 
          SET status = ${status}, 
              file_path = ${filePath || null}, 
              last_generated = NOW(),
              last_checked = NOW(),
              error_message = NULL,
              generation_count = generation_count + 1,
              success_count = success_count + 1
          WHERE product_id = ${productId}
        `;
      } else if (status === 'errored') {
        await sql`
          UPDATE species_status 
          SET status = ${status}, 
              last_checked = NOW(),
              error_message = ${errorMessage || null},
              generation_count = generation_count + 1,
              last_error = NOW()
          WHERE product_id = ${productId}
        `;
      } else {
        await sql`
          UPDATE species_status 
          SET status = ${status}, 
              last_checked = NOW(),
              error_message = ${errorMessage || null}
          WHERE product_id = ${productId}
        `;
      }

      console.log(`✅ Updated species status for product ${productId}: ${status}`);

    } catch (error) {
      console.error(`❌ Failed to update species status for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Store notification in database
   */
  static async storeNotification(notification: {
    notification_id: string;
    type: string;
    title: string;
    message: string;
    source: string;
    product_id?: string;
    priority: string;
    data?: any;
    actions?: any[];
  }): Promise<void> {
    try {
      await sql`
        INSERT INTO notifications (
          notification_id, type, title, message, source, 
          product_id, priority, data, actions
        )
        VALUES (
          ${notification.notification_id}, ${notification.type}, 
          ${notification.title}, ${notification.message}, ${notification.source},
          ${notification.product_id || null}, ${notification.priority}, 
          ${JSON.stringify(notification.data || {})}, 
          ${JSON.stringify(notification.actions || [])}
        )
        ON CONFLICT (notification_id) DO NOTHING
      `;
    } catch (error) {
      console.error('❌ Failed to store notification:', error);
    }
  }

  /**
   * Get all notifications
   */
  static async getNotifications(): Promise<DatabaseNotification[]> {
    try {
      const { rows } = await sql`
        SELECT * FROM notifications 
        ORDER BY created_at DESC 
        LIMIT 100
      `;
      return rows as DatabaseNotification[];
    } catch (error) {
      console.error('❌ Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await sql`
        UPDATE notifications 
        SET read = true 
        WHERE notification_id = ${notificationId}
      `;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    }
  }

  /**
   * Log product changes
   */
  static async logProductChange(
    productId: number, 
    fieldName: string, 
    oldValue: any, 
    newValue: any,
    detectedBy: string = 'system'
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO change_log (product_id, field_name, old_value, new_value, detected_by)
        VALUES (
          ${productId}, ${fieldName}, ${JSON.stringify(oldValue)}, 
          ${JSON.stringify(newValue)}, ${detectedBy}
        )
      `;

      // Mark species as requiring update if it was previously generated
      await sql`
        UPDATE species_status 
        SET status = 'requires-update'
        WHERE product_id = ${productId} 
        AND status = 'created'
      `;

    } catch (error) {
      console.error('❌ Failed to log product change:', error);
    }
  }

  /**
   * Get change history for a product
   */
  static async getProductChangeHistory(productId: number): Promise<DatabaseChangeLog[]> {
    try {
      const { rows } = await sql`
        SELECT * FROM change_log 
        WHERE product_id = ${productId} 
        ORDER BY changed_at DESC
        LIMIT 50
      `;
      return rows as DatabaseChangeLog[];
    } catch (error) {
      console.error('❌ Failed to get change history:', error);
      return [];
    }
  }

  /**
   * Get analytics data
   */
  static async getAnalytics(): Promise<{
    totalProducts: number;
    generatedSpecies: number;
    erroredSpecies: number;
    successRate: number;
    recentGenerations: number;
  }> {
    try {
      const [productsResult, statusResult, recentResult] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM products WHERE is_visible = true`,
        sql`
          SELECT 
            status, 
            COUNT(*) as count,
            AVG(generation_count) as avg_generations,
            SUM(success_count) as total_success
          FROM species_status 
          GROUP BY status
        `,
        sql`
          SELECT COUNT(*) as count 
          FROM species_status 
          WHERE last_generated > NOW() - INTERVAL '24 hours'
        `
      ]);

      const totalProducts = parseInt(productsResult.rows[0].count);
      const statusCounts = statusResult.rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});

      const generatedSpecies = statusCounts.created || 0;
      const erroredSpecies = statusCounts.errored || 0;
      const totalGenerations = generatedSpecies + erroredSpecies;
      const successRate = totalGenerations > 0 ? (generatedSpecies / totalGenerations) * 100 : 0;
      const recentGenerations = parseInt(recentResult.rows[0].count);

      return {
        totalProducts,
        generatedSpecies,
        erroredSpecies,
        successRate: Math.round(successRate),
        recentGenerations
      };

    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      return {
        totalProducts: 0,
        generatedSpecies: 0,
        erroredSpecies: 0,
        successRate: 0,
        recentGenerations: 0
      };
    }
  }

  /**
   * Clean old data
   */
  static async cleanOldData(): Promise<void> {
    try {
      // Remove old notifications (older than 30 days)
      await sql`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `;

      // Remove old change logs (older than 90 days)
      await sql`
        DELETE FROM change_log 
        WHERE changed_at < NOW() - INTERVAL '90 days'
      `;

      console.log('✅ Cleaned old data from database');

    } catch (error) {
      console.error('❌ Failed to clean old data:', error);
    }
  }
}
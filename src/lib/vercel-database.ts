/**
 * Vercel Database Integration
 * Provides persistent storage for products, species data, and notifications
 */

// Conditional import for optional database functionality  
let sql: any = null;
try {
  if (process.env.POSTGRES_URL && typeof window === 'undefined') {
    // Only import on server side to avoid build errors
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require('postgres');
    sql = postgres(process.env.POSTGRES_URL);
  }
} catch (error) {
  console.log('Database not configured - running without persistent storage', error);
}

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

export interface DatabaseAIContent {
  id: number;
  product_id: number;
  content_type: 'ai-search' | 'care-guide' | 'species-data' | 'plant-guide';
  content_data: any;
  file_path: string | null;
  created_at: string;
  updated_at: string;
  version: string;
  status: 'active' | 'archived';
  confidence: string;
  generated_by: string;
}

export interface DatabaseStockHistory {
  id: number;
  product_id: number;
  variant_id: number | null;
  sku: string;
  inventory_level: number;
  inventory_warning_level: number;
  is_in_stock: boolean;
  is_visible: boolean;
  recorded_at: string;
  change_type: 'initial' | 'increase' | 'decrease' | 'restock' | 'out_of_stock';
  previous_level: number | null;
  difference: number | null;
}

export interface DatabaseStockAlert {
  id: number;
  product_id: number;
  variant_id: number | null;
  sku: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'restock';
  inventory_level: number;
  threshold_level: number;
  triggered_at: string;
  resolved_at: string | null;
  is_active: boolean;
}

export interface StockPeriod {
  period_type: 'in_stock' | 'out_of_stock';
  start_date: string;
  end_date: string | null;
  duration_days: number | null;
  start_level: number;
  end_level: number | null;
}

export interface ProductLifecycleEvent {
  id: number;
  product_id: number;
  variant_id: number | null;
  event_type: 'product_added' | 'product_deleted' | 'variant_added' | 'variant_deleted' | 'product_reactivated';
  event_date: string;
  previous_status: string | null;
  new_status: string;
  detected_by: string;
  bigcommerce_created_date: string | null;
  bigcommerce_modified_date: string | null;
}

export interface DatabaseInferredStockPeriod {
  id: number;
  product_id: number;
  variant_id: number | null;
  period_type: 'inferred_out_of_stock' | 'likely_out_of_stock' | 'inferred_in_stock';
  start_date: string;
  end_date: string | null;
  duration_days: number | null;
  confidence_score: number;
  detection_method: string;
  reason: string;
  expected_sales: number;
  actual_sales: number;
  sales_gap_percentage: number;
  baseline_data: any;
  created_at: string;
  updated_at: string;
}

export class VercelDatabase {
  
  /**
   * Initialize database tables if they don't exist
   */
  static async initializeTables(): Promise<void> {
    if (!sql) {
      throw new Error('Database not configured. Please set up Vercel Postgres and add POSTGRES_URL to environment variables.');
    }
    
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

      // AI Content table
      await sql`
        CREATE TABLE IF NOT EXISTS ai_content (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(entity_id) ON DELETE CASCADE,
          content_type TEXT NOT NULL,
          content_data JSONB NOT NULL,
          file_path TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          version TEXT DEFAULT '1.0',
          status TEXT DEFAULT 'active',
          confidence TEXT DEFAULT 'medium',
          generated_by TEXT DEFAULT 'openai',
          CONSTRAINT unique_product_content UNIQUE(product_id, content_type)
        )
      `;

      // Stock History table
      await sql`
        CREATE TABLE IF NOT EXISTS stock_history (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(entity_id) ON DELETE CASCADE,
          variant_id INTEGER,
          sku TEXT NOT NULL,
          inventory_level INTEGER NOT NULL,
          inventory_warning_level INTEGER DEFAULT 0,
          is_in_stock BOOLEAN NOT NULL,
          is_visible BOOLEAN DEFAULT true,
          recorded_at TIMESTAMP DEFAULT NOW(),
          change_type TEXT NOT NULL,
          previous_level INTEGER,
          difference INTEGER
        )
      `;

      // Stock Alerts table
      await sql`
        CREATE TABLE IF NOT EXISTS stock_alerts (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(entity_id) ON DELETE CASCADE,
          variant_id INTEGER,
          sku TEXT NOT NULL,
          alert_type TEXT NOT NULL,
          inventory_level INTEGER NOT NULL,
          threshold_level INTEGER NOT NULL,
          triggered_at TIMESTAMP DEFAULT NOW(),
          resolved_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        )
      `;

      // Product Lifecycle Events table
      await sql`
        CREATE TABLE IF NOT EXISTS product_lifecycle_events (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL,
          variant_id INTEGER,
          event_type TEXT NOT NULL,
          event_date TIMESTAMP DEFAULT NOW(),
          previous_status TEXT,
          new_status TEXT NOT NULL,
          detected_by TEXT NOT NULL DEFAULT 'system',
          bigcommerce_created_date TIMESTAMP,
          bigcommerce_modified_date TIMESTAMP
        )
      `;

      // Inferred Stock Periods table for historical analysis
      await sql`
        CREATE TABLE IF NOT EXISTS inferred_stock_periods (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(entity_id) ON DELETE CASCADE,
          variant_id INTEGER,
          period_type TEXT NOT NULL CHECK (period_type IN ('inferred_out_of_stock', 'likely_out_of_stock', 'inferred_in_stock')),
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP,
          duration_days INTEGER,
          confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
          detection_method TEXT NOT NULL,
          reason TEXT NOT NULL,
          expected_sales DECIMAL(10,2),
          actual_sales DECIMAL(10,2),
          sales_gap_percentage DECIMAL(5,2),
          baseline_data JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
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
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_content_product_id ON ai_content(product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_content(content_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_content_status ON ai_content(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_history_recorded_at ON stock_history(recorded_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_history_change_type ON stock_history(change_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id ON stock_alerts(product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_alerts_is_active ON stock_alerts(is_active)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_alerts_alert_type ON stock_alerts(alert_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_lifecycle_product_id ON product_lifecycle_events(product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_lifecycle_event_type ON product_lifecycle_events(event_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_lifecycle_event_date ON product_lifecycle_events(event_date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_inferred_stock_product_id ON inferred_stock_periods(product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_inferred_stock_period_type ON inferred_stock_periods(period_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_inferred_stock_start_date ON inferred_stock_periods(start_date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_inferred_stock_confidence ON inferred_stock_periods(confidence_score)`;

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
    if (!sql) {
      console.log('Database not configured - skipping product sync');
      return;
    }
    
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
      const rows = await sql`
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
      const rows = await sql`
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
      const rows = await sql`
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
      const rows = await sql`
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

  /**
   * Ensure product exists in database before storing AI content
   */
  static async ensureProduct(productId: number, productName?: string): Promise<void> {
    if (!sql) return;

    try {
      // Check if product exists
      const rows = await sql`
        SELECT entity_id FROM products WHERE entity_id = ${productId}
      `;

      if (rows.length === 0) {
        // Product doesn't exist, create a basic record
        await sql`
          INSERT INTO products (
            entity_id, name, sku, price, categories, description, 
            brand_name, is_visible, date_created, date_modified, 
            last_synced, sync_source
          )
          VALUES (
            ${productId}, ${productName || `Product ${productId}`}, null, 0, '{}', 
            null, null, true, NOW(), NOW(), NOW(), 'ai-content-generator'
          )
        `;

        // Initialize species status
        await sql`
          INSERT INTO species_status (product_id, status, last_checked)
          VALUES (${productId}, 'no-file', NOW())
          ON CONFLICT (product_id) 
          DO UPDATE SET last_checked = NOW()
        `;

        console.log(`✅ Created basic product record for ID ${productId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to ensure product ${productId} exists:`, error);
    }
  }

  /**
   * Store AI-generated content
   */
  static async storeAIContent(
    productId: number,
    contentType: 'ai-search' | 'care-guide' | 'species-data' | 'plant-guide',
    contentData: any,
    filePath?: string,
    confidence: string = 'medium',
    generatedBy: string = 'openai'
  ): Promise<DatabaseAIContent | null> {
    if (!sql) {
      console.log('Database not configured - skipping AI content storage');
      return null;
    }

    try {
      // Ensure product exists before storing AI content
      const productName = contentData?.basicInfo?.commonNames?.[0] || contentData?.title || undefined;
      await this.ensureProduct(productId, productName);

      const rows = await sql`
        INSERT INTO ai_content (
          product_id, content_type, content_data, file_path, 
          confidence, generated_by, updated_at
        )
        VALUES (
          ${productId}, ${contentType}, ${JSON.stringify(contentData)}, 
          ${filePath || null}, ${confidence}, ${generatedBy}, NOW()
        )
        ON CONFLICT (product_id, content_type) 
        DO UPDATE SET
          content_data = EXCLUDED.content_data,
          file_path = EXCLUDED.file_path,
          confidence = EXCLUDED.confidence,
          generated_by = EXCLUDED.generated_by,
          updated_at = NOW(),
          status = 'active'
        RETURNING *
      `;

      console.log(`✅ Stored AI content for product ${productId} (${contentType})`);
      return rows[0] as DatabaseAIContent;

    } catch (error) {
      console.error(`❌ Failed to store AI content for product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Get AI content for a product
   */
  static async getAIContent(
    productId: number, 
    contentType?: 'ai-search' | 'care-guide' | 'species-data' | 'plant-guide'
  ): Promise<DatabaseAIContent[]> {
    if (!sql) {
      return [];
    }

    try {
      const query = contentType
        ? sql`
            SELECT * FROM ai_content 
            WHERE product_id = ${productId} AND content_type = ${contentType} 
            AND status = 'active'
            ORDER BY updated_at DESC
          `
        : sql`
            SELECT * FROM ai_content 
            WHERE product_id = ${productId} AND status = 'active'
            ORDER BY updated_at DESC
          `;

      const { rows } = await query;
      return rows as DatabaseAIContent[];

    } catch (error) {
      console.error(`❌ Failed to get AI content for product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Get all AI content with pagination
   */
  static async getAllAIContent(
    contentType?: 'ai-search' | 'care-guide' | 'species-data' | 'plant-guide',
    limit: number = 50,
    offset: number = 0
  ): Promise<{content: DatabaseAIContent[], total: number}> {
    if (!sql) {
      return { content: [], total: 0 };
    }

    try {
      const whereClause = contentType ? sql`WHERE content_type = ${contentType} AND status = 'active'` : sql`WHERE status = 'active'`;
      
      const [contentResult, countResult] = await Promise.all([
        sql`
          SELECT ai_content.*, products.name as product_name 
          FROM ai_content 
          JOIN products ON ai_content.product_id = products.entity_id
          ${whereClause}
          ORDER BY ai_content.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`SELECT COUNT(*) as total FROM ai_content ${whereClause}`
      ]);

      return {
        content: contentResult.rows as DatabaseAIContent[],
        total: parseInt(countResult.rows[0].total)
      };

    } catch (error) {
      console.error('❌ Failed to get all AI content:', error);
      return { content: [], total: 0 };
    }
  }

  /**
   * Delete AI content
   */
  static async deleteAIContent(id: number): Promise<boolean> {
    if (!sql) {
      return false;
    }

    try {
      await sql`
        UPDATE ai_content
        SET status = 'archived'
        WHERE id = ${id}
      `;

      console.log(`✅ Archived AI content ${id}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to archive AI content ${id}:`, error);
      return false;
    }
  }

  /**
   * Record stock level change
   */
  static async recordStockChange(
    productId: number,
    variantId: number | null,
    sku: string,
    currentLevel: number,
    warningLevel: number,
    isInStock: boolean,
    isVisible: boolean,
    previousLevel?: number
  ): Promise<void> {
    if (!sql) return;

    try {
      // Determine change type
      let changeType = 'initial';
      let difference = null;

      if (previousLevel !== undefined) {
        difference = currentLevel - previousLevel;

        if (previousLevel === 0 && currentLevel > 0) {
          changeType = 'restock';
        } else if (previousLevel > 0 && currentLevel === 0) {
          changeType = 'out_of_stock';
        } else if (difference > 0) {
          changeType = 'increase';
        } else if (difference < 0) {
          changeType = 'decrease';
        }
      }

      await sql`
        INSERT INTO stock_history (
          product_id, variant_id, sku, inventory_level, inventory_warning_level,
          is_in_stock, is_visible, change_type, previous_level, difference
        )
        VALUES (
          ${productId}, ${variantId || null}, ${sku}, ${currentLevel}, ${warningLevel},
          ${isInStock}, ${isVisible}, ${changeType}, ${previousLevel ?? null}, ${difference ?? null}
        )
      `;

      // Check for stock alerts
      await this.checkStockAlerts(productId, variantId, sku, currentLevel, warningLevel, previousLevel);

    } catch (error) {
      console.error(`❌ Failed to record stock change for ${sku}:`, error);
    }
  }

  /**
   * Check and create stock alerts
   */
  static async checkStockAlerts(
    productId: number,
    variantId: number | null,
    sku: string,
    currentLevel: number,
    warningLevel: number,
    previousLevel?: number
  ): Promise<void> {
    if (!sql) return;

    try {
      // Check for out of stock alert
      if (currentLevel === 0 && (previousLevel === undefined || previousLevel > 0)) {
        await this.createStockAlert(productId, variantId, sku, 'out_of_stock', currentLevel, 0);
      }

      // Check for low stock alert
      if (warningLevel > 0 && currentLevel > 0 && currentLevel <= warningLevel) {
        await this.createStockAlert(productId, variantId, sku, 'low_stock', currentLevel, warningLevel);
      }

      // Check for restock alert
      if (previousLevel !== undefined && previousLevel === 0 && currentLevel > 0) {
        // Resolve previous out of stock alerts
        await sql`
          UPDATE stock_alerts
          SET resolved_at = NOW(), is_active = false
          WHERE product_id = ${productId}
          AND (variant_id = ${variantId} OR (variant_id IS NULL AND ${variantId} IS NULL))
          AND alert_type = 'out_of_stock'
          AND is_active = true
        `;

        await this.createStockAlert(productId, variantId, sku, 'restock', currentLevel, 0);
      }

    } catch (error) {
      console.error(`❌ Failed to check stock alerts for ${sku}:`, error);
    }
  }

  /**
   * Create stock alert
   */
  static async createStockAlert(
    productId: number,
    variantId: number | null,
    sku: string,
    alertType: 'low_stock' | 'out_of_stock' | 'restock',
    inventoryLevel: number,
    thresholdLevel: number
  ): Promise<void> {
    if (!sql) return;

    try {
      // Resolve existing alerts of same type first
      await sql`
        UPDATE stock_alerts
        SET resolved_at = NOW(), is_active = false
        WHERE product_id = ${productId}
        AND (variant_id = ${variantId} OR (variant_id IS NULL AND ${variantId} IS NULL))
        AND alert_type = ${alertType}
        AND is_active = true
      `;

      // Create new alert
      await sql`
        INSERT INTO stock_alerts (
          product_id, variant_id, sku, alert_type,
          inventory_level, threshold_level
        )
        VALUES (
          ${productId}, ${variantId || null}, ${sku}, ${alertType},
          ${inventoryLevel}, ${thresholdLevel}
        )
      `;

    } catch (error) {
      console.error(`❌ Failed to create stock alert for ${sku}:`, error);
    }
  }

  /**
   * Get stock history for a product
   */
  static async getStockHistory(
    productId: number,
    variantId?: number,
    limit: number = 50
  ): Promise<DatabaseStockHistory[]> {
    if (!sql) return [];

    try {
      const query = variantId
        ? sql`
            SELECT * FROM stock_history
            WHERE product_id = ${productId} AND variant_id = ${variantId}
            ORDER BY recorded_at DESC
            LIMIT ${limit}
          `
        : sql`
            SELECT * FROM stock_history
            WHERE product_id = ${productId} AND variant_id IS NULL
            ORDER BY recorded_at DESC
            LIMIT ${limit}
          `;

      const rows = await query;
      return rows as DatabaseStockHistory[];

    } catch (error) {
      console.error(`❌ Failed to get stock history for product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Get active stock alerts
   */
  static async getActiveStockAlerts(): Promise<DatabaseStockAlert[]> {
    if (!sql) return [];

    try {
      const rows = await sql`
        SELECT sa.*, p.name as product_name
        FROM stock_alerts sa
        JOIN products p ON sa.product_id = p.entity_id
        WHERE sa.is_active = true
        ORDER BY sa.triggered_at DESC
      `;

      return rows as DatabaseStockAlert[];

    } catch (error) {
      console.error('❌ Failed to get active stock alerts:', error);
      return [];
    }
  }

  /**
   * Get latest stock levels for all products
   */
  static async getLatestStockLevels(): Promise<Map<string, DatabaseStockHistory>> {
    if (!sql) return new Map();

    try {
      const rows = await sql`
        SELECT DISTINCT ON (product_id, variant_id) *
        FROM stock_history
        ORDER BY product_id, variant_id, recorded_at DESC
      `;

      const stockMap = new Map<string, DatabaseStockHistory>();
      rows.forEach((row: DatabaseStockHistory) => {
        const key = row.variant_id ? `${row.product_id}_${row.variant_id}` : `${row.product_id}`;
        stockMap.set(key, row);
      });

      return stockMap;

    } catch (error) {
      console.error('❌ Failed to get latest stock levels:', error);
      return new Map();
    }
  }

  /**
   * Sync stock data from BigCommerce
   */
  static async syncStockData(inventoryItems: any[]): Promise<void> {
    if (!sql) return;

    try {
      // Get current stock levels and track which products we've seen
      const currentStock = await this.getLatestStockLevels();
      const currentProductIds = new Set<string>();

      // Get all existing products from database to detect deletions
      const existingProducts = await sql`
        SELECT DISTINCT product_id, variant_id FROM stock_history
      `;

      const existingProductKeys = new Set(
        existingProducts.map((p: any) =>
          p.variant_id ? `${p.product_id}_${p.variant_id}` : `${p.product_id}`
        )
      );

      for (const item of inventoryItems) {
        const key = item.variantId ? `${item.productId}_${item.variantId}` : `${item.productId}`;
        currentProductIds.add(key);

        const previousRecord = currentStock.get(key);
        const previousLevel = previousRecord?.inventory_level;

        // Check if this is a new product/variant
        if (!existingProductKeys.has(key)) {
          // Record lifecycle event for new product
          await this.recordLifecycleEvent(
            item.productId,
            item.variantId ? 'variant_added' : 'product_added',
            'active',
            item.variantId || undefined,
            undefined,
            item.lastUpdated,
            item.lastUpdated,
            'bigcommerce-sync'
          );

          console.log(`🆕 New ${item.variantId ? 'variant' : 'product'} detected: ${item.productId}${item.variantId ? `-${item.variantId}` : ''}`);
        }

        // Ensure product exists in database before recording stock changes
        await this.ensureProduct(item.productId, item.name);

        // Only record if level changed or this is the first record
        if (!previousRecord || previousLevel !== item.inventoryLevel) {
          await this.recordStockChange(
            item.productId,
            item.variantId || null,
            item.sku,
            item.inventoryLevel,
            item.inventoryWarningLevel,
            item.isInStock,
            item.isVisible,
            previousLevel
          );
        }
      }

      // Detect deleted products/variants
      for (const existingKey of existingProductKeys) {
        const keyStr = existingKey as string;
        if (!currentProductIds.has(keyStr)) {
          const [productIdStr, variantIdStr] = keyStr.split('_');
          const productId = parseInt(productIdStr);
          const variantId = variantIdStr ? parseInt(variantIdStr) : null;

          // Record lifecycle event for deleted product
          await this.recordLifecycleEvent(
            productId,
            variantId ? 'variant_deleted' : 'product_deleted',
            'deleted',
            variantId || undefined,
            'active',
            undefined,
            undefined,
            'bigcommerce-sync'
          );

          console.log(`🗑️ Deleted ${variantId ? 'variant' : 'product'} detected: ${productId}${variantId ? `-${variantId}` : ''}`);
        }
      }

      console.log(`✅ Synced ${inventoryItems.length} stock records`);

    } catch (error) {
      console.error('❌ Failed to sync stock data:', error);
    }
  }

  /**
   * Record product lifecycle event
   */
  static async recordLifecycleEvent(
    productId: number,
    eventType: 'product_added' | 'product_deleted' | 'variant_added' | 'variant_deleted' | 'product_reactivated',
    newStatus: string,
    variantId?: number,
    previousStatus?: string,
    bigcommerceCreatedDate?: string,
    bigcommerceModifiedDate?: string,
    detectedBy: string = 'stock-monitoring'
  ): Promise<void> {
    if (!sql) return;

    try {
      await sql`
        INSERT INTO product_lifecycle_events (
          product_id, variant_id, event_type, previous_status, new_status,
          detected_by, bigcommerce_created_date, bigcommerce_modified_date
        )
        VALUES (
          ${productId}, ${variantId || null}, ${eventType}, ${previousStatus || null},
          ${newStatus || null}, ${detectedBy}, ${bigcommerceCreatedDate || null},
          ${bigcommerceModifiedDate || null}
        )
      `;

      console.log(`✅ Recorded lifecycle event: ${eventType} for product ${productId}`);

    } catch (error) {
      console.error(`❌ Failed to record lifecycle event for product ${productId}:`, error);
    }
  }

  /**
   * Get product lifecycle events
   */
  static async getProductLifecycleEvents(
    productId: number,
    variantId?: number
  ): Promise<ProductLifecycleEvent[]> {
    if (!sql) return [];

    try {
      const query = variantId
        ? sql`
            SELECT * FROM product_lifecycle_events
            WHERE product_id = ${productId} AND variant_id = ${variantId}
            ORDER BY event_date ASC
          `
        : sql`
            SELECT * FROM product_lifecycle_events
            WHERE product_id = ${productId} AND variant_id IS NULL
            ORDER BY event_date ASC
          `;

      const rows = await query;
      return rows as ProductLifecycleEvent[];

    } catch (error) {
      console.error(`❌ Failed to get lifecycle events for product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Get stock periods (in-stock and out-of-stock date ranges) for a product
   */
  static async getStockPeriods(
    productId: number,
    variantId?: number
  ): Promise<StockPeriod[]> {
    if (!sql) return [];

    try {
      const query = variantId
        ? sql`
            SELECT *
            FROM stock_history
            WHERE product_id = ${productId} AND variant_id = ${variantId}
            ORDER BY recorded_at ASC
          `
        : sql`
            SELECT *
            FROM stock_history
            WHERE product_id = ${productId} AND variant_id IS NULL
            ORDER BY recorded_at ASC
          `;

      const rows = await query;
      const history = rows as DatabaseStockHistory[];

      if (history.length === 0) {
        return [];
      }

      const periods: StockPeriod[] = [];
      let currentPeriod: Partial<StockPeriod> | null = null;

      for (let i = 0; i < history.length; i++) {
        const record = history[i];
        const isInStock = record.is_in_stock;
        const recordDate = record.recorded_at;

        // If this is the first record or stock status changed
        if (i === 0 || (currentPeriod && (isInStock ? 'in_stock' : 'out_of_stock') !== currentPeriod.period_type)) {
          // Close previous period if exists
          if (currentPeriod) {
            currentPeriod.end_date = recordDate;
            currentPeriod.end_level = record.inventory_level;

            // Calculate duration
            if (currentPeriod.start_date && currentPeriod.end_date) {
              const startDate = new Date(currentPeriod.start_date);
              const endDate = new Date(currentPeriod.end_date);
              currentPeriod.duration_days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            }

            periods.push(currentPeriod as StockPeriod);
          }

          // Start new period
          currentPeriod = {
            period_type: isInStock ? 'in_stock' : 'out_of_stock',
            start_date: recordDate,
            end_date: null,
            duration_days: null,
            start_level: record.inventory_level,
            end_level: null
          };
        }
      }

      // Close the final period if it exists (ongoing period)
      if (currentPeriod) {
        // For ongoing periods, end_date is null and duration is calculated from start to now
        if (currentPeriod.start_date) {
          const startDate = new Date(currentPeriod.start_date);
          const now = new Date();
          currentPeriod.duration_days = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        periods.push(currentPeriod as StockPeriod);
      }

      return periods;

    } catch (error) {
      console.error(`❌ Failed to get stock periods for product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Store inferred stock periods from historical analysis
   */
  static async storeInferredStockPeriods(
    productId: number,
    variantId: number | null,
    periods: {
      period_type: 'inferred_out_of_stock' | 'likely_out_of_stock' | 'inferred_in_stock';
      start_date: string;
      end_date: string | null;
      duration_days: number | null;
      confidence_score: number;
      detection_method: string;
      reason: string;
      expected_sales: number;
      actual_sales: number;
      sales_gap_percentage: number;
      baseline_data: any;
    }[]
  ): Promise<void> {
    if (!sql) {
      console.log('Database not configured - skipping inferred periods storage');
      return;
    }

    try {
      // Ensure product exists in database
      await this.ensureProduct(productId);

      // Clear existing inferred periods for this product/variant
      await sql`
        DELETE FROM inferred_stock_periods
        WHERE product_id = ${productId}
        AND (variant_id = ${variantId} OR (variant_id IS NULL AND ${variantId} IS NULL))
      `;

      // Insert new inferred periods
      for (const period of periods) {
        await sql`
          INSERT INTO inferred_stock_periods (
            product_id, variant_id, period_type, start_date, end_date, duration_days,
            confidence_score, detection_method, reason, expected_sales, actual_sales,
            sales_gap_percentage, baseline_data
          ) VALUES (
            ${productId}, ${variantId || null}, ${period.period_type}, ${period.start_date},
            ${period.end_date}, ${period.duration_days}, ${period.confidence_score},
            ${period.detection_method}, ${period.reason || null}, ${period.expected_sales || null},
            ${period.actual_sales || null}, ${period.sales_gap_percentage || null}, ${JSON.stringify(period.baseline_data || {})}
          )
        `;
      }

      console.log(`✅ Stored ${periods.length} inferred stock periods for product ${productId}`);

    } catch (error) {
      console.error(`❌ Failed to store inferred stock periods for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get inferred stock periods for a product
   */
  static async getInferredStockPeriods(
    productId: number,
    variantId?: number | null
  ): Promise<DatabaseInferredStockPeriod[]> {
    if (!sql) {
      console.log('Database not configured - returning empty inferred periods');
      return [];
    }

    try {
      const result = await sql`
        SELECT * FROM inferred_stock_periods
        WHERE product_id = ${productId}
        AND (variant_id = ${variantId || null} OR (variant_id IS NULL AND ${variantId || null} IS NULL))
        ORDER BY start_date ASC
      `;

      return result.map((row: any) => ({
        ...row,
        baseline_data: typeof row.baseline_data === 'string' ? JSON.parse(row.baseline_data) : row.baseline_data
      }));

    } catch (error) {
      console.error(`❌ Failed to get inferred stock periods for product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Get all inferred stock periods with confidence threshold
   */
  static async getInferredStockPeriodsWithConfidence(
    minConfidence: number = 0.6
  ): Promise<DatabaseInferredStockPeriod[]> {
    if (!sql) {
      console.log('Database not configured - returning empty inferred periods');
      return [];
    }

    try {
      const result = await sql`
        SELECT isp.*, p.name as product_name
        FROM inferred_stock_periods isp
        LEFT JOIN products p ON isp.product_id = p.entity_id
        WHERE isp.confidence_score >= ${minConfidence}
        ORDER BY isp.start_date DESC
      `;

      return result.map((row: any) => ({
        ...row,
        baseline_data: typeof row.baseline_data === 'string' ? JSON.parse(row.baseline_data) : row.baseline_data
      }));

    } catch (error) {
      console.error('❌ Failed to get inferred stock periods with confidence:', error);
      return [];
    }
  }

  /**
   * Clean up old inferred stock periods (older than 2 years)
   */
  static async cleanOldInferredPeriods(): Promise<void> {
    if (!sql) {
      console.log('Database not configured - skipping cleanup');
      return;
    }

    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const result = await sql`
        DELETE FROM inferred_stock_periods
        WHERE start_date < ${twoYearsAgo.toISOString()}
      `;

      console.log(`✅ Cleaned up ${result.count} old inferred stock periods`);

    } catch (error) {
      console.error('❌ Failed to clean old inferred periods:', error);
    }
  }
}
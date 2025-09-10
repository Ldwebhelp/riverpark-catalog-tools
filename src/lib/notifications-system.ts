/**
 * Comprehensive Notifications System
 * Tracks changes between BigCommerce, Catalog Tools, and Riverpark Catalyst Fresh
 */

export interface Notification {
  id: string;
  type: 'product-updated' | 'species-generated' | 'species-outdated' | 'sync-completed' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  source: 'bigcommerce' | 'catalog-tools' | 'riverpark-fresh';
  productId?: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export interface SystemStatus {
  bigcommerce: {
    lastSync: string | null;
    status: 'healthy' | 'warning' | 'error';
    productsCount: number;
    lastError?: string;
  };
  catalogTools: {
    lastGeneration: string | null;
    status: 'healthy' | 'warning' | 'error';
    generatedCount: number;
    pendingCount: number;
    errorCount: number;
  };
  riverparkFresh: {
    lastDeploy: string | null;
    status: 'healthy' | 'warning' | 'error';
    deployedCount: number;
    lastError?: string;
  };
}

export interface ChangeTracking {
  productChanges: Map<string, {
    lastModified: string;
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      timestamp: string;
    }>;
  }>;
  speciesChanges: Map<string, {
    lastGenerated: string;
    needsUpdate: boolean;
    reason?: string;
  }>;
}

export class NotificationsSystem {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private changeTracking: ChangeTracking = {
    productChanges: new Map(),
    speciesChanges: new Map()
  };
  private systemStatus: SystemStatus = {
    bigcommerce: { lastSync: null, status: 'healthy', productsCount: 0 },
    catalogTools: { lastGeneration: null, status: 'healthy', generatedCount: 0, pendingCount: 0, errorCount: 0 },
    riverparkFresh: { lastDeploy: null, status: 'healthy', deployedCount: 0 }
  };

  /**
   * Add a new notification
   */
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.notifyListeners();
    
    // Log important notifications
    if (notification.priority === 'high' || notification.priority === 'critical') {
      console.warn(`🔔 ${notification.title}: ${notification.message}`);
    } else {
      console.log(`🔔 ${notification.title}: ${notification.message}`);
    }
  }

  /**
   * Track product changes from BigCommerce
   */
  trackProductChange(productId: string, field: string, oldValue: any, newValue: any): void {
    const existing = this.changeTracking.productChanges.get(productId);
    const change = {
      field,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    };

    if (existing) {
      existing.changes.push(change);
      existing.lastModified = change.timestamp;
    } else {
      this.changeTracking.productChanges.set(productId, {
        lastModified: change.timestamp,
        changes: [change]
      });
    }

    // Check if this product has generated species data that needs updating
    const speciesData = this.changeTracking.speciesChanges.get(productId);
    if (speciesData && speciesData.lastGenerated < change.timestamp) {
      this.changeTracking.speciesChanges.set(productId, {
        ...speciesData,
        needsUpdate: true,
        reason: `Product ${field} changed`
      });

      this.addNotification({
        type: 'species-outdated',
        title: 'Species Data Needs Update',
        message: `Product ${productId} was modified and species data needs regeneration`,
        source: 'catalog-tools',
        productId,
        priority: 'medium',
        actions: [
          { label: 'Regenerate', action: 'regenerate-species', data: { productId } },
          { label: 'View Changes', action: 'view-changes', data: { productId } }
        ]
      });
    }
  }

  /**
   * Track species data generation
   */
  trackSpeciesGeneration(productId: string, success: boolean, error?: string): void {
    const timestamp = new Date().toISOString();
    
    if (success) {
      this.changeTracking.speciesChanges.set(productId, {
        lastGenerated: timestamp,
        needsUpdate: false
      });

      this.systemStatus.catalogTools.generatedCount++;
      this.systemStatus.catalogTools.lastGeneration = timestamp;

      this.addNotification({
        type: 'species-generated',
        title: 'Species Data Generated',
        message: `Successfully generated AI species data for product ${productId}`,
        source: 'catalog-tools',
        productId,
        priority: 'low'
      });
    } else {
      this.systemStatus.catalogTools.errorCount++;
      
      this.addNotification({
        type: 'error',
        title: 'Species Generation Failed',
        message: error || `Failed to generate species data for product ${productId}`,
        source: 'catalog-tools',
        productId,
        priority: 'high',
        actions: [
          { label: 'Retry', action: 'retry-generation', data: { productId } }
        ]
      });
    }
  }

  /**
   * Check for products requiring updates
   */
  checkForUpdates(): Array<{ productId: string; reason: string; lastModified: string }> {
    const updatesNeeded: Array<{ productId: string; reason: string; lastModified: string }> = [];

    for (const [productId, speciesData] of this.changeTracking.speciesChanges.entries()) {
      if (speciesData.needsUpdate) {
        const productChanges = this.changeTracking.productChanges.get(productId);
        updatesNeeded.push({
          productId,
          reason: speciesData.reason || 'Product modified',
          lastModified: productChanges?.lastModified || speciesData.lastGenerated
        });
      }
    }

    return updatesNeeded;
  }

  /**
   * Sync with BigCommerce
   */
  async syncWithBigCommerce(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      this.addNotification({
        type: 'info',
        title: 'BigCommerce Sync Started',
        message: 'Checking for product updates from BigCommerce...',
        source: 'bigcommerce',
        priority: 'low'
      });

      // This would integrate with actual BigCommerce webhooks or polling
      // For now, we'll simulate the process
      
      this.systemStatus.bigcommerce.lastSync = timestamp;
      this.systemStatus.bigcommerce.status = 'healthy';

      this.addNotification({
        type: 'sync-completed',
        title: 'BigCommerce Sync Complete',
        message: `Synchronized ${this.systemStatus.bigcommerce.productsCount} products`,
        source: 'bigcommerce',
        priority: 'low'
      });

    } catch (error) {
      this.systemStatus.bigcommerce.status = 'error';
      this.systemStatus.bigcommerce.lastError = error instanceof Error ? error.message : 'Unknown error';

      this.addNotification({
        type: 'error',
        title: 'BigCommerce Sync Failed',
        message: `Failed to sync with BigCommerce: ${this.systemStatus.bigcommerce.lastError}`,
        source: 'bigcommerce',
        priority: 'critical',
        actions: [
          { label: 'Retry Sync', action: 'retry-sync' }
        ]
      });
    }
  }

  /**
   * Check deployment status of Riverpark Catalyst Fresh
   */
  async checkRiverparkFreshStatus(): Promise<void> {
    try {
      const response = await fetch('https://riverpark-catalyst-fresh.vercel.app/api/health/');
      
      if (response.ok) {
        const data = await response.json();
        this.systemStatus.riverparkFresh.status = 'healthy';
        this.systemStatus.riverparkFresh.lastDeploy = new Date().toISOString();
        
        if (data.speciesCount) {
          this.systemStatus.riverparkFresh.deployedCount = data.speciesCount;
        }
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }

    } catch (error) {
      this.systemStatus.riverparkFresh.status = 'error';
      this.systemStatus.riverparkFresh.lastError = error instanceof Error ? error.message : 'Unknown error';

      this.addNotification({
        type: 'error',
        title: 'Riverpark Fresh Unavailable',
        message: `Cannot connect to Riverpark Catalyst Fresh: ${this.systemStatus.riverparkFresh.lastError}`,
        source: 'riverpark-fresh',
        priority: 'high'
      });
    }
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  /**
   * Clear old notifications
   */
  clearOldNotifications(olderThanDays = 7): void {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => 
      new Date(n.timestamp).getTime() > cutoffTime
    );
    this.notifyListeners();
  }

  /**
   * Get system status
   */
  getSystemStatus(): SystemStatus {
    return { ...this.systemStatus };
  }

  /**
   * Subscribe to notifications
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Generate notification statistics
   */
  getStatistics(): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    bySource: Record<string, number>;
  } {
    const stats = {
      total: this.notifications.length,
      unread: this.getUnreadNotifications().length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      bySource: {} as Record<string, number>
    };

    this.notifications.forEach(notification => {
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      // Count by priority
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      
      // Count by source
      stats.bySource[notification.source] = (stats.bySource[notification.source] || 0) + 1;
    });

    return stats;
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Error notifying notification listener:', error);
      }
    });
  }
}

// Global notifications system instance
export const notificationsSystem = new NotificationsSystem();

// Initialize with some demo notifications for testing
notificationsSystem.addNotification({
  type: 'info',
  title: 'System Initialized',
  message: 'Enhanced AI Species Generator is ready for use',
  source: 'catalog-tools',
  priority: 'low'
});
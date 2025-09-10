'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';

interface DatabaseAnalytics {
  totalProducts: number;
  generatedSpecies: number;
  erroredSpecies: number;
  successRate: number;
  recentGenerations: number;
}

interface DatabaseStatus {
  success: boolean;
  analytics: DatabaseAnalytics;
  timestamp: string;
  error?: string;
}

export default function DatabasePage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Load database status on mount
  useEffect(() => {
    loadDatabaseStatus();
  }, []);

  const loadDatabaseStatus = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/database/init');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load database status:', error);
      setStatus({
        success: false,
        error: 'Failed to connect to database',
        analytics: {
          totalProducts: 0,
          generatedSpecies: 0,
          erroredSpecies: 0,
          successRate: 0,
          recentGenerations: 0
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDatabase = async () => {
    setInitializing(true);
    
    try {
      const response = await fetch('/api/database/init', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
        alert('✅ Database initialized successfully!');
      } else {
        alert(`❌ Database initialization failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      alert('❌ Failed to initialize database');
    } finally {
      setInitializing(false);
    }
  };

  const syncProducts = async () => {
    setSyncing(true);
    
    try {
      const response = await fetch('/api/database/sync', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(prev => prev ? { ...prev, analytics: data.analytics } : null);
        alert(`✅ Successfully synced ${data.syncedCount} products to database!`);
      } else {
        alert(`❌ Product sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to sync products:', error);
      alert('❌ Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="semantic-layout">
        <header className="semantic-header">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🗄️ Vercel Database</h1>
                <p className="text-gray-600 mt-1">Production-ready database for caching and analytics</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={loadDatabaseStatus}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                  {loading ? 'Loading...' : 'Refresh Status'}
                </button>
                <button
                  onClick={initializeDatabase}
                  disabled={initializing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                  {initializing ? 'Initializing...' : 'Initialize Database'}
                </button>
                <button
                  onClick={syncProducts}
                  disabled={syncing || !status?.success}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                  {syncing ? 'Syncing...' : 'Sync Products'}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="semantic-main">
          <div className="container mx-auto px-4 space-y-8">
            
            {/* Database Status */}
            <section className="semantic-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Status</h2>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ) : status ? (
                <>
                  {/* Connection Status */}
                  <div className={`p-4 rounded-lg border-2 mb-6 ${
                    status.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-lg">
                          {status.success ? '✅ Database Connected' : '❌ Database Error'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {status.success 
                            ? 'Vercel Postgres database is operational'
                            : status.error || 'Unknown database error'
                          }
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Last checked: {new Date(status.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Analytics Dashboard */}
                  {status.success && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {status.analytics.totalProducts}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Total Products</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {status.analytics.generatedSpecies}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Generated Species</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">
                          {status.analytics.erroredSpecies}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Failed Generations</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {status.analytics.successRate}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Success Rate</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {status.analytics.recentGenerations}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Recent (24h)</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🗄️</div>
                  <p className="text-gray-500">Click &quot;Refresh Status&quot; to check database connection</p>
                </div>
              )}
            </section>

            {/* Database Schema */}
            <section className="semantic-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Schema</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">📦 Products Table</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• entity_id (BigCommerce product ID)</li>
                    <li>• name, sku, price, categories</li>
                    <li>• description, brand_name</li>
                    <li>• sync timestamps and source</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">🐟 Species Status Table</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• product_id reference</li>
                    <li>• status (no-file, created, errored)</li>
                    <li>• generation counts and timestamps</li>
                    <li>• error tracking and file paths</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">🔔 Notifications Table</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• notification_id, type, priority</li>
                    <li>• title, message, source</li>
                    <li>• read status and timestamps</li>
                    <li>• JSON data and actions</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">📝 Change Log Table</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• product_id reference</li>
                    <li>• field_name, old_value, new_value</li>
                    <li>• change timestamps</li>
                    <li>• detected_by tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Benefits */}
            <section className="semantic-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Benefits</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">⚡</span>
                  </div>
                  <h3 className="font-medium text-gray-900">Faster Performance</h3>
                  <p className="text-sm text-gray-600">Local caching reduces API calls and improves response times</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">📊</span>
                  </div>
                  <h3 className="font-medium text-gray-900">Analytics & Insights</h3>
                  <p className="text-sm text-gray-600">Track generation success rates and identify patterns</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">🔔</span>
                  </div>
                  <h3 className="font-medium text-gray-900">Change Tracking</h3>
                  <p className="text-sm text-gray-600">Automatically detect product changes and notify users</p>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </>
  );
}
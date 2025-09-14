'use client';

import React, { useState, useEffect } from 'react';

interface InventoryItem {
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

interface StockSummary {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  lastSyncTime: string;
}

interface StockHistory {
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

interface StockAlert {
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
  product_name?: string;
}

export default function StockMonitor() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [productHistory, setProductHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'overview' | 'inventory' | 'alerts' | 'history'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');

  // Load initial data
  useEffect(() => {
    loadStockData();
    loadAlerts();
  }, []);

  const loadStockData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-monitoring?summary=true');
      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to load stock summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-monitoring');
      const data = await response.json();

      if (data.success) {
        setInventory(data.data.inventory);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/stock-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAlerts' })
      });

      const data = await response.json();
      if (data.success) {
        setAlerts(data.data.alerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const loadProductHistory = async (productId: number, variantId?: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getHistory',
          productId,
          variantId
        })
      });

      const data = await response.json();
      if (data.success) {
        setProductHistory(data.data.history);
        setSelectedProduct(productId);
      }
    } catch (error) {
      console.error('Failed to load product history:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      });

      const data = await response.json();
      if (data.success) {
        await loadStockData();
        await loadAlerts();
        if (view === 'inventory') {
          await loadFullInventory();
        }
      }
    } catch (error) {
      console.error('Failed to sync inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      stockFilter === 'all' ? true :
      stockFilter === 'in_stock' ? item.isInStock :
      stockFilter === 'out_of_stock' ? !item.isInStock :
      stockFilter === 'low_stock' ? (item.isInStock && item.inventoryLevel <= item.inventoryWarningLevel && item.inventoryWarningLevel > 0) :
      true;

    return matchesSearch && matchesFilter && item.isVisible;
  });

  const getStockStatusBadge = (item: InventoryItem) => {
    if (!item.isInStock) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Out of Stock</span>;
    }

    if (item.inventoryWarningLevel > 0 && item.inventoryLevel <= item.inventoryWarningLevel) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Low Stock</span>;
    }

    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">In Stock</span>;
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return '📈';
      case 'decrease': return '📉';
      case 'restock': return '🔄';
      case 'out_of_stock': return '❌';
      default: return '📊';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <p className="text-2xl font-bold text-gray-900">{summary.totalProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">In Stock</h3>
            <p className="text-2xl font-bold text-green-600">{summary.inStockProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
            <p className="text-2xl font-bold text-red-600">{summary.outOfStockProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
            <p className="text-2xl font-bold text-yellow-600">{summary.lowStockProducts}</p>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Stock Alerts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{alert.product_name}</p>
                <p className="text-sm text-gray-500">SKU: {alert.sku}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  alert.alert_type === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                  alert.alert_type === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {alert.alert_type.replace('_', ' ').toUpperCase()}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(alert.triggered_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products or SKUs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Stock Levels</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="low_stock">Low Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warning Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.map((item) => (
              <tr key={`${item.productId}-${item.variantId || 'main'}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.inventoryLevel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.inventoryWarningLevel}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStockStatusBadge(item)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(item.lastUpdated)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => loadProductHistory(item.productId, item.variantId)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggered</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{alert.product_name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.sku}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  alert.alert_type === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                  alert.alert_type === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {alert.alert_type.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.inventory_level}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.threshold_level}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDateTime(alert.triggered_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      {selectedProduct && (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Stock History for Product ID: {selectedProduct}
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(record.recorded_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getChangeTypeIcon(record.change_type)} {record.change_type.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.inventory_level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.previous_level ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.difference ? (record.difference > 0 ? `+${record.difference}` : record.difference) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.is_in_stock ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">In Stock</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Out of Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Stock Monitoring</h1>
        <p className="mt-2 text-gray-600">
          Track inventory levels, stock changes, and get alerts when products need attention.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'alerts', label: 'Alerts' },
            { key: 'history', label: 'History' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setView(tab.key as any);
                if (tab.key === 'inventory' && inventory.length === 0) {
                  loadFullInventory();
                }
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={syncInventory}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing...
            </>
          ) : (
            '🔄 Sync Inventory'
          )}
        </button>
      </div>

      {/* Content */}
      {loading && view === 'overview' ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {view === 'overview' && renderOverview()}
          {view === 'inventory' && renderInventory()}
          {view === 'alerts' && renderAlerts()}
          {view === 'history' && renderHistory()}
        </>
      )}
    </div>
  );
}
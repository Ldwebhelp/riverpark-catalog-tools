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

interface StockPeriod {
  period_type: 'in_stock' | 'out_of_stock';
  start_date: string;
  end_date: string | null;
  duration_days: number | null;
  start_level: number;
  end_level: number | null;
}

interface ProductLifecycleEvent {
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

interface InferredStockPeriod {
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

  // Modal state for stock periods
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<InventoryItem | null>(null);
  const [stockPeriods, setStockPeriods] = useState<StockPeriod[]>([]);
  const [lifecycleEvents, setLifecycleEvents] = useState<ProductLifecycleEvent[]>([]);
  const [inferredStockPeriods, setInferredStockPeriods] = useState<InferredStockPeriod[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [generatingInference, setGeneratingInference] = useState(false);

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

  const showProductModal = async (product: InventoryItem) => {
    setModalProduct(product);
    setShowModal(true);
    setModalLoading(true);

    try {
      const response = await fetch('/api/stock-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getCompleteHistory',
          productId: product.productId,
          variantId: product.variantId
        })
      });

      const data = await response.json();
      if (data.success) {
        setStockPeriods(data.data.stockPeriods);
        setLifecycleEvents(data.data.lifecycleEvents);
        setInferredStockPeriods(data.data.inferredStockPeriods || []);
      }
    } catch (error) {
      console.error('Failed to load complete history:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalProduct(null);
    setStockPeriods([]);
    setLifecycleEvents([]);
    setInferredStockPeriods([]);
    setGeneratingInference(false);
  };

  const generateInferredHistory = async (product: InventoryItem) => {
    setGeneratingInference(true);
    try {
      const response = await fetch('/api/stock-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateInferredHistory',
          productId: product.productId,
          variantId: product.variantId
        })
      });

      const data = await response.json();
      if (data.success) {
        // Reload the complete history to get the newly stored inferred periods
        await showProductModal(product);
      } else {
        console.error('Failed to generate inferred history:', data.error);
      }
    } catch (error) {
      console.error('Error generating inferred history:', error);
    } finally {
      setGeneratingInference(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const productIdString = `${item.productId}${item.variantId ? `-${item.variantId}` : ''}`;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         productIdString.includes(searchTerm.toLowerCase());

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

  const getLifecycleEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'product_added': return '🆕';
      case 'variant_added': return '🆕';
      case 'product_deleted': return '🗑️';
      case 'variant_deleted': return '🗑️';
      case 'product_reactivated': return '🔄';
      default: return '📅';
    }
  };

  const getLifecycleEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'product_added': return 'Product Added to BigCommerce';
      case 'variant_added': return 'Variant Added to BigCommerce';
      case 'product_deleted': return 'Product Deleted from BigCommerce';
      case 'variant_deleted': return 'Variant Deleted from BigCommerce';
      case 'product_reactivated': return 'Product Reactivated';
      default: return eventType.replace('_', ' ').toUpperCase();
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">High Confidence</span>;
    } else if (confidence >= 0.6) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Medium Confidence</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Low Confidence</span>;
    }
  };

  const getInferredPeriodIcon = (periodType: string) => {
    switch (periodType) {
      case 'inferred_out_of_stock': return '🔍';
      case 'likely_out_of_stock': return '⚠️';
      case 'inferred_in_stock': return '✅';
      default: return '📊';
    }
  };

  const getInferredPeriodLabel = (periodType: string) => {
    switch (periodType) {
      case 'inferred_out_of_stock': return 'Inferred Out of Stock';
      case 'likely_out_of_stock': return 'Likely Out of Stock';
      case 'inferred_in_stock': return 'Inferred In Stock';
      default: return periodType;
    }
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
          placeholder="Search products or Product IDs..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
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
                  <button
                    onClick={() => showProductModal(item)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-900 text-left"
                  >
                    {item.name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.productId}{item.variantId ? `-${item.variantId}` : ''}
                </td>
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

      {/* Stock Periods Modal */}
      {showModal && modalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Stock History</h3>
                  <p className="text-sm text-gray-600 mt-1">{modalProduct.name}</p>
                  <p className="text-xs text-gray-500">
                    Product ID: {modalProduct.productId}{modalProduct.variantId ? `-${modalProduct.variantId}` : ''}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {modalLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Product Status */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">📊</span>
                      <h4 className="text-md font-medium text-blue-900">Current Product Status</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-blue-600 font-medium">Stock Level</div>
                        <div className="text-gray-900">{modalProduct?.inventoryLevel || 0}</div>
                      </div>
                      <div>
                        <div className="text-blue-600 font-medium">Warning Level</div>
                        <div className="text-gray-900">{modalProduct?.inventoryWarningLevel || 0}</div>
                      </div>
                      <div>
                        <div className="text-blue-600 font-medium">Status</div>
                        <div>{modalProduct && getStockStatusBadge(modalProduct)}</div>
                      </div>
                      <div>
                        <div className="text-blue-600 font-medium">Last Updated</div>
                        <div className="text-gray-900 text-xs">
                          {modalProduct ? formatDateTime(modalProduct.lastUpdated) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Lifecycle Timeline */}
                  {lifecycleEvents.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Product Lifecycle Timeline</h4>
                      <div className="text-sm text-gray-600">
                        When this product was added to your BigCommerce store
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-3">
                          {lifecycleEvents.map((event) => (
                            <div key={event.id} className="flex items-center space-x-3 text-sm">
                              <span className="text-lg">{getLifecycleEventIcon(event.event_type)}</span>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {getLifecycleEventLabel(event.event_type)}
                                </div>
                                <div className="text-gray-500">
                                  {formatDateTime(event.event_date)}
                                  {event.bigcommerce_created_date && event.bigcommerce_created_date !== event.event_date && (
                                    <span className="ml-2 text-xs">
                                      (BigCommerce: {formatDateTime(event.bigcommerce_created_date)})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {event.detected_by}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stock Availability Periods - DISABLED: Shows misleading dates from initial sync */}
                  {false && stockPeriods.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Stock Availability History</h4>
                      <div className="text-sm text-gray-600">
                        Stock availability periods showing when this product was in stock vs out of stock
                      </div>

                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Start Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            End Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Level
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stockPeriods.map((period, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                period.period_type === 'in_stock'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {period.period_type === 'in_stock' ? '✅ In Stock' : '❌ Out of Stock'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDateTime(period.start_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {period.end_date ? formatDateTime(period.end_date) : (
                                <span className="text-green-600 font-medium">Ongoing</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {period.duration_days !== null ? (
                                period.duration_days === 1 ? '1 day' : `${period.duration_days} days`
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <span>{period.start_level}</span>
                                {period.end_level !== null && period.end_level !== period.start_level && (
                                  <>
                                    <span className="text-gray-400">→</span>
                                    <span>{period.end_level}</span>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                      {/* Summary Stats */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-green-800">Total In-Stock Time</div>
                          <div className="text-lg font-bold text-green-900">
                            {stockPeriods
                              .filter(p => p.period_type === 'in_stock')
                              .reduce((total, p) => total + (p.duration_days || 0), 0)} days
                          </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-red-800">Total Out-of-Stock Time</div>
                          <div className="text-lg font-bold text-red-900">
                            {stockPeriods
                              .filter(p => p.period_type === 'out_of_stock')
                              .reduce((total, p) => total + (p.duration_days || 0), 0)} days
                          </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-blue-800">Stock Changes</div>
                          <div className="text-lg font-bold text-blue-900">
                            {stockPeriods.length} periods
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Historical Inference Section - DISABLED: BigCommerce orders API access restricted */}
                  {false && <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-medium text-gray-900">
                        🧠 AI-Inferred Historical Stock Analysis (DISABLED)
                      </h4>
                      {modalProduct && (
                        <button
                          onClick={() => modalProduct && generateInferredHistory(modalProduct)}
                          disabled={generatingInference}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            generatingInference
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {generatingInference ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500 inline" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Analyzing...
                            </>
                          ) : (
                            <>
                              🔍 Generate Historical Analysis
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      Analyze your sales data to infer when this product was likely out of stock in the past
                    </div>

                    {inferredStockPeriods.length > 0 ? (
                      <div className="space-y-4">
                        {/* Inferred Periods Summary */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">🎯</span>
                            <h5 className="text-sm font-medium text-purple-900">Analysis Results</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-purple-600 font-medium">Inferred Out-of-Stock Periods</div>
                              <div className="text-gray-900 text-lg font-bold">
                                {inferredStockPeriods.filter(p => p.period_type === 'inferred_out_of_stock').length}
                              </div>
                            </div>
                            <div>
                              <div className="text-purple-600 font-medium">Average Confidence</div>
                              <div className="text-gray-900 text-lg font-bold">
                                {Math.round(inferredStockPeriods.reduce((sum, p) => sum + p.confidence_score, 0) / inferredStockPeriods.length * 100)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-purple-600 font-medium">Total Inferred Days Out</div>
                              <div className="text-gray-900 text-lg font-bold">
                                {inferredStockPeriods.reduce((sum, p) => sum + (p.duration_days || 0), 0)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Inferred Periods Table */}
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Period
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Start Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Duration
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Confidence
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Detection Method
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {inferredStockPeriods.map((period, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{getInferredPeriodIcon(period.period_type)}</span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {getInferredPeriodLabel(period.period_type)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {formatDateTime(period.start_date)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {period.duration_days ? (
                                      period.duration_days === 1 ? '1 day' : `${period.duration_days} days`
                                    ) : (
                                      <span className="text-orange-600 font-medium">Ongoing</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {getConfidenceBadge(period.confidence_score)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {period.detection_method.replace('_', ' ').toUpperCase()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Detailed Analysis */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">📊</span>
                            <h5 className="text-sm font-medium text-blue-900">Analysis Details</h5>
                          </div>
                          <div className="space-y-2 text-sm text-blue-800">
                            {inferredStockPeriods.slice(0, 3).map((period, index) => (
                              <div key={index} className="bg-white rounded p-2">
                                <div className="font-medium">
                                  {formatDateTime(period.start_date)} - {period.end_date ? formatDateTime(period.end_date) : 'Ongoing'}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {period.reason}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Expected: {period.expected_sales.toFixed(1)} sales | Actual: {period.actual_sales} sales
                                </div>
                              </div>
                            ))}
                            {inferredStockPeriods.length > 3 && (
                              <div className="text-xs text-blue-600 font-medium">
                                + {inferredStockPeriods.length - 3} more periods
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">🤖</span>
                          <h5 className="text-sm font-medium text-gray-700">No Historical Analysis Available</h5>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Click &ldquo;Generate Historical Analysis&rdquo; to analyze your sales data and infer past out-of-stock periods.</p>
                          <p className="text-xs text-gray-500">
                            This analysis uses AI to examine sales patterns and identify likely stock-out periods from your BigCommerce order history.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>}

                  {/* Enhanced no data message with explanation */}
                  {lifecycleEvents.length === 0 && stockPeriods.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xl">ℹ️</span>
                        <h4 className="text-md font-medium text-yellow-900">Historical Data Not Available</h4>
                      </div>
                      <div className="text-sm text-yellow-800 space-y-2">
                        <p>
                          <strong>Why no history is showing:</strong> The BigCommerce API only provides current inventory levels,
                          not historical stock changes. This stock monitoring system is designed to track changes going forward.
                        </p>
                        <p>
                          <strong>What this means:</strong> Even though your BigCommerce store has been running for 2+ years,
                          we can only track stock changes from when this monitoring system was first activated.
                        </p>
                        <p>
                          <strong>Going forward:</strong> This system will capture all future stock level changes,
                          in/out of stock events, and product lifecycle events to build a comprehensive history.
                        </p>
                      </div>
                      <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 mb-1">Current tracking status:</div>
                          <div className="text-gray-600">✅ Product lifecycle tracking active</div>
                          <div className="text-gray-600">✅ Stock level monitoring active</div>
                          <div className="text-gray-600">✅ Future changes will be recorded</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
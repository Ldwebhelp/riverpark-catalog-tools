'use client';

import { useState, useEffect } from 'react';
import { Database, SpeciesFileInfo, BigCommerceProduct } from '@/lib/database';
import { SpeciesData } from '@/types/catalog';
import SpeciesEditor from './SpeciesEditor';

interface SpeciesFileManagerProps {
  onUpdate?: () => void;
}

export default function SpeciesFileManager({ onUpdate }: SpeciesFileManagerProps) {
  const [files, setFiles] = useState<SpeciesFileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [bigcommerceProducts, setBigcommerceProducts] = useState<BigCommerceProduct[]>([]);
  const [showBigCommerceData, setShowBigCommerceData] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [editingSpecies, setEditingSpecies] = useState<SpeciesData | null>(null);

  const catalystDestination = '/Users/lindsay/GitHub/riverpark-catalyst-fresh/frontend/content/fish-species';

  useEffect(() => {
    loadFiles();
    loadBigCommerceData();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const allFiles = await Database.getAllSpeciesFiles();
      setFiles(allFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBigCommerceData = async () => {
    try {
      const products = await Database.getBigCommerceProducts();
      setBigcommerceProducts(products);
      setLastSync(new Date());
      console.log('BigCommerce data loaded:', products.length, 'products');
    } catch (error) {
      console.error('Error loading BigCommerce data:', error);
    }
  };

  const handleFileSelect = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(files.map(f => f.productId)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFiles.size} selected files? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setProcessing(true);
    try {
      await Database.deleteSpeciesFiles(Array.from(selectedFiles));
      await loadFiles();
      setSelectedFiles(new Set());
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Error deleting files. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyToCatalyst = async () => {
    if (selectedFiles.size === 0) return;

    setProcessing(true);
    try {
      const result = await Database.copyFilesToDestination(
        Array.from(selectedFiles),
        catalystDestination
      );
      
      if (result.success) {
        alert(`Successfully copied ${result.copiedFiles.length} files to riverpark-catalyst-fresh!`);
      } else {
        alert(`Copy completed with some errors:\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Error copying files:', error);
      alert('Error copying files. This feature requires server-side implementation.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedFiles.size === 0) return;
    
    // Download each selected file
    selectedFiles.forEach(async (productId) => {
      const species = await Database.getSpecies(productId);
      if (species) {
        const dataStr = JSON.stringify(species, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${species.productId}-species.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleEditFile = async (productId: string) => {
    try {
      const species = await Database.getSpecies(productId);
      if (species) {
        setEditingSpecies(species);
      } else {
        alert('Species data not found');
      }
    } catch (error) {
      console.error('Error loading species for editing:', error);
      alert('Error loading species data for editing');
    }
  };

  const handleSaveEdit = async () => {
    await loadFiles();
    onUpdate?.();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="semantic-section">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>Loading species files...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Management Controls */}
      <section className="semantic-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Species File Management ({files.length} files)
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBigCommerceData(!showBigCommerceData)}
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
            >
              {showBigCommerceData ? 'Hide' : 'Show'} BigCommerce Data
            </button>
            <button
              onClick={loadBigCommerceData}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {files.length > 0 && (
          <div className="bg-gray-50 border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">
                    Select All ({selectedFiles.size} selected)
                  </span>
                </label>
              </div>
              
              {selectedFiles.size > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadSelected}
                    disabled={processing}
                    className="text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors"
                  >
                    Download Selected
                  </button>
                  <button
                    onClick={handleCopyToCatalyst}
                    disabled={processing}
                    className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors"
                  >
                    Copy to Catalyst
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={processing}
                    className="text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BigCommerce Data Panel */}
        {showBigCommerceData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-green-900">
                Live BigCommerce Data ({bigcommerceProducts.length} products)
              </h4>
              {lastSync && (
                <span className="text-sm text-green-700">
                  Last synced: {formatDate(lastSync.toISOString())}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {bigcommerceProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="font-medium text-sm text-gray-900 truncate" title={product.name}>
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    £{product.price.toFixed(2)} | Stock: {product.inventory_level}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    SKU: {product.sku} | Categories: {product.categories.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Files Table */}
      <section className="semantic-section">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            No species files found. Upload and process data to create files.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === files.length && files.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Species
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className={selectedFiles.has(file.productId) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.productId)}
                        onChange={(e) => handleFileSelect(file.productId, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{file.commonName}</span>
                          {bigcommerceProducts.length > 0 && (
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full" title="BigCommerce data available"></span>
                          )}
                        </div>
                        {file.scientificName && (
                          <div className="text-sm text-gray-600 italic">{file.scientificName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{file.productId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{file.fileName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(file.fileSize)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(file.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(file.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadSelected()}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Download file"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleEditFile(file.productId)}
                          className="text-green-600 hover:text-green-800 text-sm"
                          title="Edit file"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div className="font-medium">Processing...</div>
            </div>
          </div>
        </div>
      )}

      {/* Species Editor Modal */}
      <SpeciesEditor
        species={editingSpecies}
        onClose={() => setEditingSpecies(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
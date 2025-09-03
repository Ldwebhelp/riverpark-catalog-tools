'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getEnhancedSpecifications } from '@/lib/speciesDatabase';
import { CatalogDatabase } from '@/lib/database';
import { SpeciesData, GenerationStats } from '@/types/catalog';

export default function SpeciesGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [generatedData, setGeneratedData] = useState<SpeciesData[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Reset previous results
      setGeneratedData([]);
      setStats(null);
      setSessionId(null);
      setDownloadStatus({});
    }
  };

  const processExcelFile = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const results: SpeciesData[] = [];
      const processingStats: GenerationStats = {
        totalProcessed: jsonData.length,
        enhanced: 0,
        fallbackUsed: 0,
        errors: 0
      };

      for (const [index, record] of jsonData.entries()) {
        try {
          const recordAny = record as Record<string, unknown>;
          const productId = String(recordAny.productId || recordAny.ProductID || recordAny.id || `product_${index + 1}`);
          const commonName = String(recordAny.commonName || recordAny.name || recordAny.CommonName || 'Unknown Species');
          const scientificName = recordAny.scientificName ? String(recordAny.scientificName || recordAny.ScientificName || recordAny.scientific_name) : undefined;
          const waterType = recordAny.waterType ? String(recordAny.waterType) : undefined;

          // Get enhanced specifications from real database matches only
          const enhancedSpecs = getEnhancedSpecifications(recordAny);
          
          // Track whether we found a real database match
          if (enhancedSpecs) {
            processingStats.enhanced++;
          } else {
            processingStats.fallbackUsed++; // Tracks species using only file data (no database enhancement)
          }
          
          // Use waterType from file, or database match, or require user input
          const finalWaterType = waterType || enhancedSpecs?.waterType;

          const speciesData: SpeciesData = {
            id: crypto.randomUUID(),
            productId,
            type: String(recordAny.type || 'species'),
            scientificName,
            commonName,
            specifications: {
              ...recordAny, // Original data from file
              ...(enhancedSpecs || {}), // Enhanced specifications (only if database match found)
              ...(finalWaterType ? { waterType: finalWaterType } : {}) // Include waterType only if available
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          results.push(speciesData);
        } catch (error) {
          processingStats.errors++;
          console.error(`Error processing record ${index}:`, error);
        }
      }

      // Save session data
      const sessionId = await CatalogDatabase.saveSpeciesData(results, processingStats);
      
      setGeneratedData(results);
      setStats(processingStats);
      setSessionId(sessionId);

    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing Excel file. Please check the format and try again.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadJSON = async (species: SpeciesData) => {
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

    // Track download
    if (sessionId) {
      await CatalogDatabase.trackDownload({
        sessionId,
        fileName: link.download,
        downloadedAt: new Date().toISOString(),
        fileType: 'species'
      });
    }

    // Update download status
    setDownloadStatus(prev => ({
      ...prev,
      [species.id]: true
    }));
  };

  const downloadAllJSON = async () => {
    const allData = {
      session: sessionId,
      generatedAt: new Date().toISOString(),
      stats,
      species: generatedData
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `species-data-bulk-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Track bulk download
    if (sessionId) {
      await CatalogDatabase.trackDownload({
        sessionId,
        fileName: link.download,
        downloadedAt: new Date().toISOString(),
        fileType: 'species'
      });
    }

    // Mark all as downloaded
    const allDownloaded = generatedData.reduce((acc, species) => {
      acc[species.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setDownloadStatus(allDownloaded);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* File Upload Section */}
      <section className="semantic-section">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Species Data Generator</h2>
        <p className="text-gray-600 mb-6">
          Upload an Excel file containing species data to generate enhanced JSON files with comprehensive care specifications.
        </p>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="space-y-2">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <div className="text-lg font-medium text-gray-900">
                {file ? file.name : 'Click to upload Excel file'}
              </div>
              <p className="text-sm text-gray-500">Supports .xlsx, .xls, and .csv files</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary mt-4"
            >
              Choose File
            </button>
          </div>

          {file && (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <div>
                  <div className="font-medium text-gray-900">{file.name}</div>
                  <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                onClick={processExcelFile}
                disabled={processing}
                className="btn-success disabled:bg-gray-400"
              >
                {processing ? 'Processing...' : 'Generate Species Data'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Processing Status */}
      {processing && (
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <div className="font-medium text-blue-900">Processing Excel file...</div>
              <div className="text-sm text-blue-700">Enhancing species data with care specifications</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {stats && generatedData.length > 0 && (
        <div className="space-y-6">
          {/* Statistics */}
          <section className="semantic-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generation Statistics</h3>
              <button
                onClick={downloadAllJSON}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Download All JSON
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalProcessed}</div>
                <div className="text-sm text-gray-600">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.enhanced}</div>
                <div className="text-sm text-gray-600">Database Enhanced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.fallbackUsed}</div>
                <div className="text-sm text-gray-600">File Data Only</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>
          </section>

          {/* Generated Species */}
          <section className="semantic-section">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Species Data</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generatedData.map((species) => (
                <div key={species.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{species.commonName}</h4>
                        {downloadStatus[species.id] ? (
                          <span className="status-badge-success">
                            ✓ Downloaded
                          </span>
                        ) : (
                          <span className="status-badge-pending">
                            Pending
                          </span>
                        )}
                      </div>
                      {species.scientificName && (
                        <div className="text-sm text-gray-600 italic mt-1">{species.scientificName}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Product ID: {species.productId}</div>
                    </div>
                    
                    <button
                      onClick={() => downloadJSON(species)}
                      className="btn-primary text-sm"
                    >
                      Download JSON
                    </button>
                  </div>
                  
                  {/* Preview of enhanced specifications */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600 mb-2">Enhanced Specifications Preview:</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {species.specifications.minTankSize && (
                        <div><span className="font-medium">Tank:</span> {species.specifications.minTankSize}</div>
                      )}
                      {species.specifications.temperatureRange && (
                        <div><span className="font-medium">Temp:</span> {species.specifications.temperatureRange}</div>
                      )}
                      {species.specifications.diet && (
                        <div><span className="font-medium">Diet:</span> {species.specifications.diet}</div>
                      )}
                      {species.specifications.careLevel && (
                        <div><span className="font-medium">Care:</span> {species.specifications.careLevel}</div>
                      )}
                      {species.specifications.temperament && (
                        <div><span className="font-medium">Temperament:</span> {species.specifications.temperament}</div>
                      )}
                      {species.specifications.family && (
                        <div><span className="font-medium">Family:</span> {species.specifications.family}</div>
                      )}
                      {species.specifications.waterType && (
                        <div><span className="font-medium">Water Type:</span> {species.specifications.waterType}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
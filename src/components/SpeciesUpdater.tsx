'use client';

import { useState, useRef } from 'react';
import { getEnhancedSpecifications, getSpeciesFromDatabase } from '@/lib/speciesDatabase';
import { CatalogDatabase } from '@/lib/database';
import { SpeciesData, GenerationStats } from '@/types/catalog';

interface SpecificationUpdate {
  field: string;
  oldValue: string;
  newValue: string;
}

interface UpdatedSpecies extends SpeciesData {
  updates: SpecificationUpdate[];
  updateReason: string;
}

export default function SpeciesUpdater() {
  const [existingData, setExistingData] = useState<SpeciesData[]>([]);
  const [updatedData, setUpdatedData] = useState<UpdatedSpecies[]>([]);
  const [updateSpecs, setUpdateSpecs] = useState<Record<string, any>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Handle both single species and array of species
      const speciesArray = Array.isArray(data.species) ? data.species : 
                          Array.isArray(data) ? data : [data];
      
      setExistingData(speciesArray);
      setUpdatedData([]);
      setUpdateSpecs({});
    } catch (error) {
      alert('Invalid JSON file. Please upload existing species data.');
    }
  };

  const handleSpecUpdate = (field: string, value: string) => {
    setUpdateSpecs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyUpdatestoSpecies = async () => {
    if (existingData.length === 0) return;

    setIsUpdating(true);
    try {
      const results: UpdatedSpecies[] = [];

      for (const species of existingData) {
        const updates: SpecificationUpdate[] = [];
        
        // Create updated specifications
        const updatedSpecifications = { ...species.specifications };
        
        // Apply global updates from updateSpecs
        Object.entries(updateSpecs).forEach(([field, newValue]) => {
          if (newValue && newValue.trim()) {
            const oldValue = String(updatedSpecifications[field] || 'Not set');
            updatedSpecifications[field] = newValue;
            updates.push({
              field,
              oldValue,
              newValue: String(newValue)
            });
          }
        });

        // Get enhanced specifications from database (includes new waterType)
        const enhancedSpecs = getEnhancedSpecifications({
          ...species,
          commonName: species.commonName,
          scientificName: species.scientificName
        });

        // Update with enhanced specifications if not already set
        Object.entries(enhancedSpecs).forEach(([field, value]) => {
          if (field === 'waterType' && !updatedSpecifications.waterType) {
            const oldValue = String(updatedSpecifications[field] || 'Not set');
            updatedSpecifications[field] = value;
            updates.push({
              field,
              oldValue,
              newValue: String(value)
            });
          }
        });

        const updatedSpecies: UpdatedSpecies = {
          ...species,
          specifications: updatedSpecifications,
          updatedAt: new Date().toISOString(),
          updates,
          updateReason: 'Bulk specification update with enhanced database matching'
        };

        results.push(updatedSpecies);
      }

      // Save updated session
      const stats: GenerationStats = {
        totalProcessed: results.length,
        enhanced: results.filter(s => s.updates.length > 0).length,
        fallbackUsed: results.filter(s => s.updates.length === 0).length,
        errors: 0
      };

      const sessionId = await CatalogDatabase.saveSpeciesData(results, stats);
      
      setUpdatedData(results);
      setSessionId(sessionId);

    } catch (error) {
      console.error('Update failed:', error);
      alert('Update failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadUpdatedJSON = async (species: UpdatedSpecies) => {
    const dataStr = JSON.stringify(species, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${species.productId}-updated-species.json`;
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
  };

  const downloadAllUpdated = async () => {
    const allData = {
      session: sessionId,
      updatedAt: new Date().toISOString(),
      stats: {
        totalProcessed: updatedData.length,
        speciesWithUpdates: updatedData.filter(s => s.updates.length > 0).length,
        totalUpdates: updatedData.reduce((sum, s) => sum + s.updates.length, 0)
      },
      species: updatedData
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `species-data-updated-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* File Upload Section */}
      <section className="semantic-section">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Existing Species Data</h2>
        <p className="text-gray-600 mb-6">
          Upload existing species JSON files to update them with new specifications like waterType classification.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="space-y-2">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <div className="text-lg font-medium text-gray-900">
              Upload Existing Species JSON
            </div>
            <p className="text-sm text-gray-500">Previously generated species data files</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary mt-4"
          >
            Choose File
          </button>
        </div>

        {existingData.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-800 font-medium">
                Loaded {existingData.length} existing species records
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Update Specifications */}
      {existingData.length > 0 && (
        <section className="semantic-section">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Global Specification Updates</h3>
          <p className="text-gray-600 mb-4">
            Add or update specifications that will be applied to all species. Leave blank to skip.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water Type</label>
              <select
                value={updateSpecs.waterType || ''}
                onChange={(e) => handleSpecUpdate('waterType', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm"
              >
                <option value="">Auto-detect from database</option>
                <option value="Freshwater">Freshwater</option>
                <option value="Coldwater">Coldwater</option>
                <option value="Brackish">Brackish</option>
                <option value="Saltwater">Saltwater</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Care Level Override</label>
              <select
                value={updateSpecs.careLevel || ''}
                onChange={(e) => handleSpecUpdate('careLevel', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm"
              >
                <option value="">Keep existing</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <input
                type="text"
                value={updateSpecs.additionalNotes || ''}
                onChange={(e) => handleSpecUpdate('additionalNotes', e.target.value)}
                placeholder="Add notes to all species"
                className="w-full rounded-lg border-gray-300 shadow-sm"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={applyUpdatestoSpecies}
              disabled={isUpdating}
              className="btn-success disabled:bg-gray-400"
            >
              {isUpdating ? 'Updating Species...' : `Update ${existingData.length} Species`}
            </button>
          </div>
        </section>
      )}

      {/* Updated Results */}
      {updatedData.length > 0 && (
        <div className="space-y-6">
          {/* Statistics */}
          <section className="semantic-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Results</h3>
              <button
                onClick={downloadAllUpdated}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Download All Updated JSON
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{updatedData.length}</div>
                <div className="text-sm text-gray-600">Total Species</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {updatedData.filter(s => s.updates.length > 0).length}
                </div>
                <div className="text-sm text-gray-600">Species Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {updatedData.reduce((sum, s) => sum + s.updates.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Updates</div>
              </div>
            </div>
          </section>

          {/* Updated Species List */}
          <section className="semantic-section">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Updated Species</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {updatedData.map((species) => (
                <div key={species.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{species.commonName}</h4>
                        {species.updates.length > 0 ? (
                          <span className="status-badge-success">
                            {species.updates.length} Updates
                          </span>
                        ) : (
                          <span className="status-badge-pending">
                            No Changes
                          </span>
                        )}
                      </div>
                      {species.scientificName && (
                        <div className="text-sm text-gray-600 italic mt-1">{species.scientificName}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Product ID: {species.productId}</div>
                    </div>
                    
                    <button
                      onClick={() => downloadUpdatedJSON(species)}
                      className="btn-primary text-sm"
                    >
                      Download JSON
                    </button>
                  </div>
                  
                  {/* Show updates */}
                  {species.updates.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-600 mb-2">Applied Updates:</div>
                      <div className="space-y-1">
                        {species.updates.map((update, index) => (
                          <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                            <span className="font-medium">{update.field}:</span>{' '}
                            <span className="text-red-600 line-through">{update.oldValue}</span>{' '}
                            →{' '}
                            <span className="text-green-600">{update.newValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { SpeciesData } from '@/types/catalog';
import { CatalogDatabase } from '@/lib/database';

interface SpeciesEditorProps {
  species: SpeciesData | null;
  onClose: () => void;
  onSave: (species: SpeciesData) => void;
}

export default function SpeciesEditor({ species, onClose, onSave }: SpeciesEditorProps) {
  const [formData, setFormData] = useState<Partial<SpeciesData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (species) {
      setFormData(species);
    }
  }, [species]);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('specifications.')) {
      const specField = field.replace('specifications.', '');
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.id || !formData.productId) return;

    setLoading(true);
    try {
      const updatedSpecies: SpeciesData = {
        ...formData as SpeciesData,
        updatedAt: new Date().toISOString()
      };

      await CatalogDatabase.updateSpecies(updatedSpecies);
      onSave(updatedSpecies);
      onClose();
    } catch (error) {
      console.error('Error saving species:', error);
      alert('Error saving species data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!species) return null;

  const specs = formData.specifications || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Species: {formData.commonName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Common Name
                </label>
                <input
                  type="text"
                  value={formData.commonName || ''}
                  onChange={(e) => handleInputChange('commonName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scientific Name
                </label>
                <input
                  type="text"
                  value={formData.scientificName || ''}
                  onChange={(e) => handleInputChange('scientificName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <input
                  type="text"
                  value={formData.productId || ''}
                  onChange={(e) => handleInputChange('productId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <input
                  type="text"
                  value={formData.type || ''}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Care Specifications */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Care Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Tank Size
                  </label>
                  <input
                    type="text"
                    value={specs.minTankSize || ''}
                    onChange={(e) => handleInputChange('specifications.minTankSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 120L"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature Range
                  </label>
                  <input
                    type="text"
                    value={specs.temperatureRange || ''}
                    onChange={(e) => handleInputChange('specifications.temperatureRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 22-26°C"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    pH Range
                  </label>
                  <input
                    type="text"
                    value={specs.phRange || ''}
                    onChange={(e) => handleInputChange('specifications.phRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 7.8-8.6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Water Type
                  </label>
                  <select
                    value={specs.waterType || ''}
                    onChange={(e) => handleInputChange('specifications.waterType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select water type</option>
                    <option value="Freshwater">Freshwater</option>
                    <option value="Saltwater">Saltwater</option>
                    <option value="Brackish">Brackish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diet
                  </label>
                  <input
                    type="text"
                    value={specs.diet || ''}
                    onChange={(e) => handleInputChange('specifications.diet', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Omnivore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Care Level
                  </label>
                  <select
                    value={specs.careLevel || ''}
                    onChange={(e) => handleInputChange('specifications.careLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select care level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperament
                  </label>
                  <input
                    type="text"
                    value={specs.temperament || ''}
                    onChange={(e) => handleInputChange('specifications.temperament', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Semi-aggressive"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adult Size
                  </label>
                  <input
                    type="text"
                    value={specs.adultSize || ''}
                    onChange={(e) => handleInputChange('specifications.adultSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 12cm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family
                  </label>
                  <input
                    type="text"
                    value={specs.family || ''}
                    onChange={(e) => handleInputChange('specifications.family', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Cichlidae"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origin
                  </label>
                  <input
                    type="text"
                    value={specs.origin || ''}
                    onChange={(e) => handleInputChange('specifications.origin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Lake Malawi"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import WebAppLayout from '@/components/WebAppLayout';

interface CareGuide {
  id: string;
  title: string;
  species: string;
  scientificName: string;
  productId?: string;
  sections: {
    overview: string;
    tankRequirements: string;
    waterConditions: string;
    feeding: string;
    tankMates: string;
    breeding: string;
    healthCare: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
}

interface CareGuideFilters {
  searchTerm: string;
  status: 'all' | 'draft' | 'published' | 'archived';
  tags: string[];
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'species';
  sortOrder: 'asc' | 'desc';
}

export default function CareGuidesPage() {
  const [guides, setGuides] = useState<CareGuide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<CareGuide | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<CareGuideFilters>({
    searchTerm: '',
    status: 'all',
    tags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadCareGuides();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [guides, filters]);

  const loadCareGuides = async () => {
    setLoading(true);
    try {
      // Simulate loading care guides from database
      // In production, this would call your API
      const mockGuides: CareGuide[] = [
        {
          id: '1',
          title: 'Complete Care Guide for Neon Tetra',
          species: 'Neon Tetra',
          scientificName: 'Paracheirodon innesi',
          productId: '123',
          sections: {
            overview: 'Neon Tetras are small, peaceful freshwater fish known for their vibrant blue and red coloration.',
            tankRequirements: 'Minimum tank size: 75L (20 gallons). Prefer planted tanks with soft substrate.',
            waterConditions: 'Temperature: 22-26°C, pH: 6.0-7.0, Hardness: 1-10 dGH',
            feeding: 'Omnivorous. Feed high-quality flakes, micro pellets, and occasional live/frozen foods.',
            tankMates: 'Compatible with other peaceful community fish. Avoid large or aggressive species.',
            breeding: 'Egg scatterers. Require soft, acidic water and fine-leaved plants for spawning.',
            healthCare: 'Susceptible to neon tetra disease. Maintain clean water and stable parameters.'
          },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z',
          status: 'published',
          tags: ['community', 'beginner-friendly', 'schooling', 'planted-tank']
        },
        {
          id: '2',
          title: 'Complete Care Guide for Betta Fish',
          species: 'Betta Fish',
          scientificName: 'Betta splendens',
          productId: '456',
          sections: {
            overview: 'Bettas are colorful labyrinth fish known for their flowing fins and territorial nature.',
            tankRequirements: 'Minimum tank size: 19L (5 gallons). Prefer warm water with gentle filtration.',
            waterConditions: 'Temperature: 24-28°C, pH: 6.5-7.5, Hardness: 5-20 dGH',
            feeding: 'Carnivorous. Feed high-quality betta pellets and occasional live/frozen foods.',
            tankMates: 'Males must be kept alone. Females can sometimes be kept in groups.',
            breeding: 'Bubble nest builders. Males guard eggs and fry aggressively.',
            healthCare: 'Prone to fin rot and swim bladder issues. Maintain warm, clean water.'
          },
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-18T16:45:00Z',
          status: 'published',
          tags: ['beginner-friendly', 'territorial', 'labyrinth-fish']
        },
        {
          id: '3',
          title: 'Complete Care Guide for Angelfish',
          species: 'Angelfish',
          scientificName: 'Pterophyllum scalare',
          productId: '789',
          sections: {
            overview: 'Angelfish are elegant cichlids with distinctive triangular shape and long fins.',
            tankRequirements: 'Minimum tank size: 200L (55 gallons). Prefer tall tanks with plenty of swimming space.',
            waterConditions: 'Temperature: 24-28°C, pH: 6.0-7.5, Hardness: 3-15 dGH',
            feeding: 'Omnivorous. Feed varied diet of flakes, pellets, and live/frozen foods.',
            tankMates: 'Semi-aggressive. Compatible with similar-sized peaceful fish.',
            breeding: 'Egg layers. Form pairs and guard their eggs on flat surfaces.',
            healthCare: 'Susceptible to ich and hole-in-the-head disease. Regular water changes essential.'
          },
          createdAt: '2024-01-05T11:00:00Z',
          updatedAt: '2024-01-12T13:20:00Z',
          status: 'draft',
          tags: ['cichlid', 'semi-aggressive', 'breeding', 'tall-tank']
        }
      ];

      setGuides(mockGuides);
      
      // Extract unique tags
      const allTags = mockGuides.flatMap(guide => guide.tags);
      setAvailableTags([...new Set(allTags)].sort());

    } catch (error) {
      console.error('Failed to load care guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...guides];

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(guide =>
        guide.title.toLowerCase().includes(term) ||
        guide.species.toLowerCase().includes(term) ||
        guide.scientificName.toLowerCase().includes(term) ||
        guide.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(guide => guide.status === filters.status);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(guide =>
        filters.tags.some(tag => guide.tags.includes(tag))
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      
      switch (filters.sortBy) {
        case 'title':
          return order * a.title.localeCompare(b.title);
        case 'species':
          return order * a.species.localeCompare(b.species);
        case 'createdAt':
          return order * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'updatedAt':
          return order * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        default:
          return 0;
      }
    });

    setFilteredGuides(filtered);
  };

  const handleFilterChange = (newFilters: Partial<CareGuideFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      tags: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return '✅';
      case 'draft':
        return '📝';
      case 'archived':
        return '📦';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <WebAppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </WebAppLayout>
    );
  }

  return (
    <WebAppLayout>
      <div className="p-6 space-y-6">
        
        {/* Page Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredGuides.length} of {guides.length} care guides
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <span>➕</span>
                <span>New Guide</span>
              </button>
              <button
                onClick={loadCareGuides}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Reset All
                </button>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Guides
                </label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                  placeholder="Search by species, title, or tags..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value as CareGuideFilters['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags ({availableTags.length})
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag)}
                        onChange={(e) => {
                          const newTags = e.target.checked
                            ? [...filters.tags, tag]
                            : filters.tags.filter(t => t !== tag);
                          handleFilterChange({ tags: newTags });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 truncate">
                        {tag}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange({ 
                      sortBy: sortBy as CareGuideFilters['sortBy'],
                      sortOrder: sortOrder as CareGuideFilters['sortOrder']
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="updatedAt-desc">Recently Updated</option>
                  <option value="createdAt-desc">Recently Created</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="species-asc">Species (A-Z)</option>
                  <option value="species-desc">Species (Z-A)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Care Guides List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              
              {/* Guides Grid */}
              <div className="divide-y divide-gray-200">
                {filteredGuides.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No care guides found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your filters or create a new guide</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Create Your First Guide
                    </button>
                  </div>
                ) : (
                  filteredGuides.map(guide => (
                    <div
                      key={guide.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedGuide(guide)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {guide.title}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(guide.status)}`}>
                              <span className="mr-1">{getStatusIcon(guide.status)}</span>
                              {guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="font-medium">{guide.species}</span>
                            <span className="italic">{guide.scientificName}</span>
                            {guide.productId && (
                              <span>Product ID: {guide.productId}</span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {guide.tags.slice(0, 4).map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {guide.tags.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{guide.tags.length - 4} more
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2">
                            {guide.sections.overview}
                          </p>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-xs text-gray-500">
                            Updated: {new Date(guide.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Created: {new Date(guide.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Care Guide Detail Modal */}
        {selectedGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedGuide.title}</h2>
                    <p className="text-gray-600">{selectedGuide.species} • {selectedGuide.scientificName}</p>
                  </div>
                  <button
                    onClick={() => setSelectedGuide(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {Object.entries(selectedGuide.sections).map(([sectionKey, content]) => (
                  <div key={sectionKey}>
                    <h4 className="font-medium text-gray-700 mb-2 capitalize">
                      {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-gray-600">{content}</p>
                  </div>
                ))}

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGuide.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2">{selectedGuide.status}</span>
                    </div>
                    <div>
                      <span className="font-medium">Product ID:</span>
                      <span className="ml-2">{selectedGuide.productId || 'None'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{new Date(selectedGuide.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>
                      <span className="ml-2">{new Date(selectedGuide.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Guide Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Create New Care Guide</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                  <p className="text-gray-600">
                    Advanced care guide creation with AI assistance will be available in the next update.
                    For now, guides can be imported from the AI Species Generator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </WebAppLayout>
  );
}
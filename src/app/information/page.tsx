'use client';

import { useState, useEffect } from 'react';
import WebAppLayout from '@/components/WebAppLayout';

interface InformationPanel {
  id: string;
  title: string;
  type: 'faq' | 'guide' | 'tutorial' | 'specification' | 'troubleshooting' | 'maintenance';
  category: string;
  content: string;
  shortDescription: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  lastViewed?: string;
  relatedProducts?: string[];
  targetAudience: 'beginner' | 'intermediate' | 'advanced' | 'all';
}

interface InformationFilters {
  searchTerm: string;
  type: 'all' | InformationPanel['type'];
  category: string;
  status: 'all' | InformationPanel['status'];
  targetAudience: 'all' | InformationPanel['targetAudience'];
  priority: 'all' | InformationPanel['priority'];
  tags: string[];
  sortBy: 'title' | 'updatedAt' | 'viewCount' | 'priority';
  sortOrder: 'asc' | 'desc';
}

export default function InformationPage() {
  const [panels, setPanels] = useState<InformationPanel[]>([]);
  const [filteredPanels, setFilteredPanels] = useState<InformationPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState<InformationPanel | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<InformationFilters>({
    searchTerm: '',
    type: 'all',
    category: '',
    status: 'all',
    targetAudience: 'all',
    priority: 'all',
    tags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadInformationPanels();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [panels, filters]);

  const loadInformationPanels = async () => {
    setLoading(true);
    try {
      // Mock data for information panels
      const mockPanels: InformationPanel[] = [
        {
          id: '1',
          title: 'Complete Guide to Aquarium Water Testing',
          type: 'guide',
          category: 'Water Chemistry',
          content: `Water testing is crucial for maintaining a healthy aquarium. Regular testing helps you monitor key parameters that affect fish health and tank stability.

**Essential Parameters to Test:**
- pH Level (6.0-8.5 depending on species)
- Ammonia (should be 0 ppm)
- Nitrite (should be 0 ppm)
- Nitrate (should be <20 ppm)
- Temperature
- Hardness (GH and KH)

**Testing Schedule:**
- New tanks: Daily for first 4-6 weeks
- Established tanks: Weekly
- After water changes: Within 24 hours
- When fish show signs of stress: Immediately

**Common Testing Mistakes:**
1. Not rinsing test tubes properly
2. Using expired test kits
3. Testing immediately after water changes
4. Not following timing instructions exactly

**Recommended Test Kits:**
- API Master Test Kit (comprehensive)
- Salifert Test Kits (marine tanks)
- Digital pH meters for precision`,
          shortDescription: 'Essential guide covering water testing parameters, schedules, and best practices for aquarium maintenance.',
          tags: ['water-testing', 'aquarium-maintenance', 'water-chemistry', 'beginner-guide'],
          priority: 'high',
          status: 'active',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T14:30:00Z',
          viewCount: 1247,
          lastViewed: '2024-01-20T09:15:00Z',
          relatedProducts: ['123', '456', '789'],
          targetAudience: 'beginner'
        },
        {
          id: '2',
          title: 'FAQ: Common Fish Disease Symptoms',
          type: 'faq',
          category: 'Fish Health',
          content: `**Q: My fish has white spots all over its body. What is this?**
A: This is likely Ich (white spot disease), a common parasitic infection. Treat with increased temperature (gradually to 86°F) and appropriate medication.

**Q: Fish is swimming upside down or sideways. What's wrong?**
A: This could be swim bladder disorder. Fast the fish for 24-48 hours, then feed cooked peas. Check water quality.

**Q: Fish has torn or rotting fins. How do I treat this?**
A: Fin rot is usually caused by poor water quality. Improve water conditions and consider antibacterial treatment.

**Q: Fish is lying on the bottom and breathing heavily. Is it dying?**
A: Check ammonia and nitrite levels immediately. Heavy breathing often indicates poor water quality or low oxygen.

**Q: My fish won't eat. Should I be concerned?**
A: New fish may not eat for several days. If established fish stop eating, check water parameters and look for other symptoms.

**Q: Fish has fluffy white growth on body or fins. What is it?**
A: This is likely fungal infection. Treat with antifungal medication and improve water quality.`,
          shortDescription: 'Common fish disease symptoms and quick treatment guidance for aquarium owners.',
          tags: ['fish-health', 'disease-symptoms', 'troubleshooting', 'faq'],
          priority: 'high',
          status: 'active',
          createdAt: '2024-01-08T11:00:00Z',
          updatedAt: '2024-01-18T16:45:00Z',
          viewCount: 892,
          lastViewed: '2024-01-19T15:30:00Z',
          relatedProducts: ['234', '567'],
          targetAudience: 'all'
        },
        {
          id: '3',
          title: 'Advanced CO2 System Setup and Tuning',
          type: 'tutorial',
          category: 'Planted Tanks',
          content: `Setting up a CO2 system for planted tanks requires careful planning and precise tuning for optimal plant growth.

**Equipment Needed:**
- CO2 cylinder (5-10lb recommended)
- Pressure regulator with solenoid
- Needle valve for fine control
- Bubble counter
- Diffuser (ceramic or glass)
- Drop checker with 4dKH solution
- Timer for automation

**Installation Steps:**
1. Install regulator on CO2 cylinder
2. Connect tubing from regulator to bubble counter
3. Connect bubble counter to diffuser
4. Place diffuser in area with good flow
5. Install drop checker opposite diffuser
6. Connect solenoid to timer

**Tuning Process:**
- Start with 1 bubble per second per 50L
- Monitor drop checker (should be green)
- Adjust gradually over several days
- Turn on CO2 2 hours before lights
- Turn off 1 hour before lights off

**Safety Considerations:**
- Ensure good ventilation
- Monitor fish behavior closely
- Have airstone ready as backup
- Check for leaks regularly`,
          shortDescription: 'Comprehensive tutorial for setting up and tuning CO2 injection systems in planted aquariums.',
          tags: ['co2-injection', 'planted-tanks', 'advanced-setup', 'tutorial'],
          priority: 'medium',
          status: 'active',
          createdAt: '2024-01-05T14:00:00Z',
          updatedAt: '2024-01-12T10:20:00Z',
          viewCount: 543,
          lastViewed: '2024-01-17T12:45:00Z',
          relatedProducts: ['345', '678', '901'],
          targetAudience: 'advanced'
        },
        {
          id: '4',
          title: 'Filter Maintenance Schedule and Procedures',
          type: 'maintenance',
          category: 'Equipment Maintenance',
          content: `Regular filter maintenance is essential for aquarium health. Follow these schedules and procedures for optimal performance.

**Maintenance Schedule:**

**Weekly:**
- Check filter flow rate
- Clean pre-filter sponges (if applicable)
- Remove visible debris from intake

**Bi-weekly:**
- Rinse mechanical filter media
- Check and clean impeller housing
- Inspect tubing for blockages

**Monthly:**
- Replace or thoroughly clean mechanical media
- Clean filter housing
- Check all seals and gaskets
- Lubricate O-rings if needed

**Quarterly:**
- Replace carbon (if used)
- Deep clean all components
- Check and replace worn parts
- Test all electrical connections

**Step-by-Step Cleaning:**
1. Turn off filter and unplug
2. Remove and set aside biological media
3. Rinse mechanical media in tank water
4. Clean impeller and housing
5. Reassemble with biological media first
6. Prime filter before restarting
7. Monitor for proper operation

**Warning Signs:**
- Reduced flow rate
- Unusual noises
- Water bypassing filter
- Visible wear on components`,
          shortDescription: 'Complete maintenance schedule and procedures for aquarium filtration systems.',
          tags: ['filter-maintenance', 'equipment-care', 'maintenance-schedule', 'procedures'],
          priority: 'medium',
          status: 'active',
          createdAt: '2024-01-03T09:00:00Z',
          updatedAt: '2024-01-14T11:15:00Z',
          viewCount: 721,
          lastViewed: '2024-01-16T14:20:00Z',
          relatedProducts: ['456', '789'],
          targetAudience: 'intermediate'
        },
        {
          id: '5',
          title: 'Troubleshooting Common Heater Problems',
          type: 'troubleshooting',
          category: 'Equipment Issues',
          content: `Aquarium heaters are critical for tropical fish health. Here's how to diagnose and fix common heater problems.

**Problem: Heater not heating**
- Check power connection and outlet
- Verify heater is fully submerged
- Test with multimeter for continuity
- Replace if internal element is broken
- Check if thermostat is stuck

**Problem: Overheating**
- Thermostat may be faulty
- Heater may be stuck "on"
- Remove immediately to prevent fish death
- Use backup heater while replacing
- Consider using heater controller

**Problem: Temperature fluctuations**
- Heater may be undersized for tank
- Check for drafts or cold spots
- Ensure proper water circulation
- Consider adding second heater
- Verify accurate thermometer reading

**Problem: Heater cracked or leaking**
- Turn off and remove immediately
- Never operate cracked heater in water
- Check for electrical shorts
- Replace entire unit - never repair
- Consider impact-resistant models

**Prevention Tips:**
- Always unplug before water changes
- Use heater guard to prevent damage
- Check regularly for cracks or wear
- Keep spare heater for emergencies
- Never exceed manufacturer's tank size rating

**Safety Warning:**
Never touch electrical equipment with wet hands. Always unplug heaters before maintenance.`,
          shortDescription: 'Diagnostic guide for aquarium heater problems with safety procedures and solutions.',
          tags: ['heater-problems', 'troubleshooting', 'equipment-repair', 'safety'],
          priority: 'high',
          status: 'active',
          createdAt: '2024-01-01T16:00:00Z',
          updatedAt: '2024-01-10T13:40:00Z',
          viewCount: 634,
          lastViewed: '2024-01-15T08:10:00Z',
          relatedProducts: ['112', '334'],
          targetAudience: 'intermediate'
        }
      ];

      setPanels(mockPanels);
      
      // Extract unique categories and tags
      const categories = [...new Set(mockPanels.map(panel => panel.category))].sort();
      const allTags = mockPanels.flatMap(panel => panel.tags);
      const uniqueTags = [...new Set(allTags)].sort();
      
      setAvailableCategories(categories);
      setAvailableTags(uniqueTags);

    } catch (error) {
      console.error('Failed to load information panels:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...panels];

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(panel =>
        panel.title.toLowerCase().includes(term) ||
        panel.content.toLowerCase().includes(term) ||
        panel.shortDescription.toLowerCase().includes(term) ||
        panel.tags.some(tag => tag.toLowerCase().includes(term)) ||
        panel.category.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(panel => panel.type === filters.type);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(panel => panel.category === filters.category);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(panel => panel.status === filters.status);
    }

    // Target audience filter
    if (filters.targetAudience !== 'all') {
      filtered = filtered.filter(panel => 
        panel.targetAudience === filters.targetAudience || panel.targetAudience === 'all'
      );
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(panel => panel.priority === filters.priority);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(panel =>
        filters.tags.some(tag => panel.tags.includes(tag))
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      
      switch (filters.sortBy) {
        case 'title':
          return order * a.title.localeCompare(b.title);
        case 'viewCount':
          return order * (a.viewCount - b.viewCount);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return order * (priorityOrder[a.priority] - priorityOrder[b.priority]);
        case 'updatedAt':
          return order * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        default:
          return 0;
      }
    });

    setFilteredPanels(filtered);
  };

  const handleFilterChange = (newFilters: Partial<InformationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      type: 'all',
      category: '',
      status: 'all',
      targetAudience: 'all',
      priority: 'all',
      tags: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'faq': return '❓';
      case 'guide': return '📖';
      case 'tutorial': return '🎓';
      case 'specification': return '📏';
      case 'troubleshooting': return '🔧';
      case 'maintenance': return '⚙️';
      default: return '📄';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'all': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Information Panels</h1>
              <p className="text-gray-600 mt-1">
                Dynamic content management with {panels.length} information resources
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Showing {filteredPanels.length} panels
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <span>➕</span>
                <span>New Panel</span>
              </button>
              <button
                onClick={loadInformationPanels}
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
                  Search Content
                </label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                  placeholder="Search by title, content, or tags..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange({ type: e.target.value as InformationFilters['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="faq">FAQ</option>
                  <option value="guide">Guide</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="specification">Specification</option>
                  <option value="troubleshooting">Troubleshooting</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange({ category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={filters.targetAudience}
                  onChange={(e) => handleFilterChange({ targetAudience: e.target.value as InformationFilters['targetAudience'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange({ priority: e.target.value as InformationFilters['priority'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
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
                      sortBy: sortBy as InformationFilters['sortBy'],
                      sortOrder: sortOrder as InformationFilters['sortOrder']
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="updatedAt-desc">Recently Updated</option>
                  <option value="viewCount-desc">Most Viewed</option>
                  <option value="priority-desc">Highest Priority</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Information Panels List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              
              {/* Panels Grid */}
              <div className="divide-y divide-gray-200">
                {filteredPanels.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No information panels found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your filters or create a new panel</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Create Your First Panel
                    </button>
                  </div>
                ) : (
                  filteredPanels.map(panel => (
                    <div
                      key={panel.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedPanel(panel)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{getTypeIcon(panel.type)}</span>
                            <h3 className="font-medium text-gray-900">
                              {panel.title}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(panel.status)}`}>
                              {panel.status.charAt(0).toUpperCase() + panel.status.slice(1)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(panel.priority)}`}>
                              {panel.priority.charAt(0).toUpperCase() + panel.priority.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="font-medium">{panel.category}</span>
                            <span className={`px-2 py-1 rounded text-xs ${getAudienceColor(panel.targetAudience)}`}>
                              {panel.targetAudience}
                            </span>
                            <span>👁️ {panel.viewCount} views</span>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {panel.tags.slice(0, 4).map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {panel.tags.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{panel.tags.length - 4} more
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2">
                            {panel.shortDescription}
                          </p>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-xs text-gray-500">
                            Updated: {new Date(panel.updatedAt).toLocaleDateString()}
                          </div>
                          {panel.lastViewed && (
                            <div className="text-xs text-gray-400 mt-1">
                              Last viewed: {new Date(panel.lastViewed).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Detail Modal */}
        {selectedPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(selectedPanel.type)}</span>
                      <h2 className="text-xl font-bold text-gray-900">{selectedPanel.title}</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">{selectedPanel.category}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getAudienceColor(selectedPanel.targetAudience)}`}>
                        {selectedPanel.targetAudience}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedPanel.priority)}`}>
                        {selectedPanel.priority}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPanel(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Content</h4>
                  <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
                    {selectedPanel.content}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPanel.tags.map(tag => (
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
                      <span className="font-medium">Type:</span>
                      <span className="ml-2">{selectedPanel.type}</span>
                    </div>
                    <div>
                      <span className="font-medium">View Count:</span>
                      <span className="ml-2">{selectedPanel.viewCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{new Date(selectedPanel.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>
                      <span className="ml-2">{new Date(selectedPanel.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Panel Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Create New Information Panel</h2>
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
                    Advanced content management with WYSIWYG editor and template system will be available in the next update.
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
'use client';

import { useState, useRef } from 'react';
import { getSpeciesFromDatabase } from '@/lib/speciesDatabase';
import { CatalogDatabase } from '@/lib/database';
import { AIProductMatcher } from '@/lib/ai-product-matcher';
import { 
  GuideSection, 
  SpeciesData, 
  AIEnhancedGuide, 
  CareEcosystem, 
  SmartBundle,
  ProductRecommendation 
} from '@/types/catalog';

interface GenerationProgress {
  total: number;
  current: number;
  currentSpecies: string;
  currentStage: string;
}

export function AIEnhancedCareGuideGenerator() {
  const [uploadedSpeciesData, setUploadedSpeciesData] = useState<SpeciesData[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [generatedGuides, setGeneratedGuides] = useState<AIEnhancedGuide[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [includeProductRecommendations, setIncludeProductRecommendations] = useState(true);
  const [includeSmartBundles, setIncludeSmartBundles] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const speciesArray = Array.isArray(data) ? data : [data];
      setUploadedSpeciesData(speciesArray);
      setSelectedSpecies(speciesArray.map((s: SpeciesData) => s.productId));
    } catch {
      alert('Invalid JSON file. Please upload species data from the Species Generator.');
    }
  };

  const toggleSpecies = (productId: string) => {
    setSelectedSpecies(prev => 
      prev.includes(productId) 
        ? prev.filter(s => s !== productId)
        : [...prev, productId]
    );
  };

  const selectAllSpecies = () => {
    setSelectedSpecies(uploadedSpeciesData.map(s => s.productId));
  };

  const clearSelection = () => {
    setSelectedSpecies([]);
  };

  const generateAIEnhancedGuide = async (speciesData: SpeciesData): Promise<AIEnhancedGuide> => {
    const commonName = speciesData.commonName || 'Unknown Species';
    const species = getSpeciesFromDatabase(commonName);
    
    // Use database species info or fallback to specifications
    const specInfo = species || {
      commonName,
      scientificName: speciesData.scientificName,
      family: String(speciesData.specifications.family || 'Unknown'),
      origin: String(speciesData.specifications.origin || 'Unknown'),
      minTankSize: String(speciesData.specifications.minTankSize || '80L'),
      temperatureRange: String(speciesData.specifications.temperatureRange || '22-26°C'),
      phRange: String(speciesData.specifications.phRange || '6.5-7.5'),
      maxSize: String(speciesData.specifications.maxSize || '10cm'),
      diet: String(speciesData.specifications.diet || 'Omnivore'),
      careLevel: 'Intermediate' as const,
      temperament: 'Peaceful' as const,
      groupSize: String(speciesData.specifications.groupSize || 'single or group'),
      compatibility: [],
      specialRequirements: []
    };

    const slug = commonName.toLowerCase().replace(/\s+/g, '-');

    // Generate basic care guide sections
    const sections: GuideSection[] = [
      {
        title: "Species Overview",
        content: `The ${specInfo.commonName} (${specInfo.scientificName || 'Scientific name varies'}) is a ${specInfo.careLevel.toLowerCase()} level aquarium fish from ${specInfo.origin}. Known for their ${specInfo.temperament.toLowerCase()} nature, these fish make ${specInfo.temperament === 'Peaceful' ? 'excellent community tank residents' : specInfo.temperament === 'Semi-Aggressive' ? 'suitable additions to carefully planned community tanks' : 'challenging but rewarding specimens for experienced aquarists'}.`
      },
      {
        title: "Tank Requirements",
        content: `${specInfo.commonName} require a minimum tank size of ${specInfo.minTankSize} to thrive. The aquarium should be well-established with stable water parameters and adequate swimming space. ${specInfo.groupSize.includes('group') || specInfo.groupSize.includes('school') ? `These fish are social and should be kept ${specInfo.groupSize}.` : `${specInfo.commonName} can be kept ${specInfo.groupSize}.`}`
      },
      {
        title: "Water Parameters",
        content: `Maintain water temperature between ${specInfo.temperatureRange} and pH levels of ${specInfo.phRange}. Regular water changes of 20-25% weekly are essential for maintaining optimal water quality. Use a reliable heater and thermometer to ensure temperature stability.`
      },
      {
        title: "Diet and Feeding",
        content: `${specInfo.commonName} are ${specInfo.diet.toLowerCase()} and should be fed a varied diet appropriate to their nutritional needs. Feed small portions 2-3 times daily, only providing what can be consumed within 2-3 minutes. ${specInfo.diet === 'Omnivore' ? 'Offer a mix of high-quality flakes, pellets, and occasional live or frozen foods.' : specInfo.diet === 'Carnivore' ? 'Provide protein-rich foods including live or frozen bloodworms, brine shrimp, and quality carnivore pellets.' : 'Focus on plant-based foods including algae wafers, blanched vegetables, and quality herbivore pellets.'}`
      },
      {
        title: "Tank Mates and Compatibility",
        content: `${specInfo.commonName} are ${specInfo.temperament.toLowerCase()} fish that ${specInfo.compatibility.length > 0 ? `work well with ${specInfo.compatibility.slice(0, 3).join(', ')}${specInfo.compatibility.length > 3 ? ' and other compatible species' : ''}` : 'require careful tank mate selection'}. ${specInfo.temperament === 'Peaceful' ? 'They can be housed with most other peaceful community fish of similar size.' : specInfo.temperament === 'Semi-Aggressive' ? 'Choose tank mates carefully, avoiding very small or overly aggressive species.' : 'Best kept with other robust fish that can handle their assertive nature.'}`
      },
      {
        title: "Health and Common Issues",
        content: `${specInfo.commonName} are generally hardy fish when provided with proper care. Watch for signs of stress including loss of appetite, lethargy, or unusual swimming patterns. Common issues include ich, fin rot, and water quality-related stress. ${specInfo.specialRequirements ? `Special considerations: ${specInfo.specialRequirements.join(', ')}.` : ''} Maintain excellent water quality and quarantine new additions to prevent disease introduction.`
      },
      {
        title: "Breeding and Reproduction", 
        content: `${specInfo.commonName} ${specInfo.family === 'Cichlidae' ? 'are substrate spawners that may breed readily in the home aquarium. Provide flat stones or caves for spawning sites and be prepared to separate breeding pairs if aggression increases.' : specInfo.family === 'Poeciliidae' ? 'are livebearers that reproduce easily in the aquarium. Females can produce 20-50 fry every 4-6 weeks. Provide dense vegetation or breeding boxes to protect fry.' : 'can be bred in the home aquarium with proper conditions. Research specific breeding requirements for this species and provide appropriate spawning conditions.'} Breeding success often indicates excellent water quality and proper nutrition.`
      }
    ];

    // Generate AI-powered product recommendations
    let careEcosystem: CareEcosystem = {
      setup: { filtration: [], substrate: [], decoration: [], lighting: [], heating: [] },
      maintenance: { waterTreatment: [], cleaning: [], testing: [] },
      nutrition: { food: [], supplements: [] },
      health: { medication: [], quarantine: [] }
    };
    
    let smartBundles: SmartBundle[] = [];

    if (includeProductRecommendations) {
      careEcosystem = await AIProductMatcher.generateCareEcosystem(speciesData);
    }

    if (includeSmartBundles) {
      smartBundles = await AIProductMatcher.generateSmartBundles(speciesData, careEcosystem);
    }

    // Generate AI metadata
    const aiMetadata = {
      searchKeywords: [
        commonName.toLowerCase(),
        specInfo.scientificName?.toLowerCase() || '',
        specInfo.family.toLowerCase(),
        specInfo.temperament.toLowerCase(),
        specInfo.careLevel.toLowerCase(),
        `${specInfo.careLevel.toLowerCase()} fish`,
        `${specInfo.temperament.toLowerCase()} fish`
      ].filter(Boolean),
      commonQuestions: [
        {
          question: `What tank size do ${commonName} need?`,
          answer: `${commonName} need a minimum tank size of ${specInfo.minTankSize} to thrive properly.`
        },
        {
          question: `What do ${commonName} eat?`,
          answer: `${commonName} are ${specInfo.diet.toLowerCase()} and should be fed a varied diet appropriate to their nutritional needs.`
        },
        {
          question: `Are ${commonName} suitable for beginners?`,
          answer: `${commonName} are ${specInfo.careLevel.toLowerCase()}-level fish, ${specInfo.careLevel === 'Beginner' ? 'making them suitable for beginners' : specInfo.careLevel === 'Intermediate' ? 'requiring some aquarium experience' : 'best suited for experienced aquarists'}.`
        }
      ],
      compatibleSpecies: specInfo.compatibility || [],
      avoidWith: [],
      ukSpecific: {
        energyCost: 'Moderate heating costs for UK homes',
        waterHardness: 'Compatible with UK tap water when properly conditioned', 
        seasonalCare: ['Monitor temperature during winter months', 'Increase feeding slightly in summer']
      }
    };

    return {
      id: crypto.randomUUID(),
      title: `Our Guide To Keeping ${specInfo.commonName}`,
      slug,
      species: commonName,
      productId: speciesData.productId,
      sections,
      createdAt: new Date().toISOString(),
      careEcosystem,
      smartBundles,
      aiMetadata
    };
  };

  const generateGuides = async () => {
    if (selectedSpecies.length === 0) return;

    setIsGenerating(true);
    setProgress({ total: selectedSpecies.length, current: 0, currentSpecies: '', currentStage: 'Initializing...' });

    try {
      // Initialize BigCommerce products
      if (includeProductRecommendations || includeSmartBundles) {
        setProgress(prev => prev ? { ...prev, currentStage: 'Loading product database...' } : null);
        // BigCommerce products are now loaded from JSON database
      }

      const guides: AIEnhancedGuide[] = [];

      for (let i = 0; i < selectedSpecies.length; i++) {
        const productId = selectedSpecies[i];
        const speciesData = uploadedSpeciesData.find(s => s.productId === productId);
        if (!speciesData) continue;

        setProgress({ 
          total: selectedSpecies.length, 
          current: i, 
          currentSpecies: speciesData.commonName || 'Unknown',
          currentStage: 'Generating care guide...'
        });

        const guide = await generateAIEnhancedGuide(speciesData);
        guides.push(guide);

        setProgress(prev => prev ? { ...prev, currentStage: 'Saving guide...' } : null);

        // Save enhanced guide
        await CatalogDatabase.saveGuide({
          id: guide.id,
          title: guide.title,
          slug: guide.slug,
          species: guide.species,
          content: guide.sections,
          createdAt: guide.createdAt
        });

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setGeneratedGuides(guides);
      setProgress({ 
        total: selectedSpecies.length, 
        current: selectedSpecies.length, 
        currentSpecies: 'Complete',
        currentStage: 'All guides generated successfully!'
      });

    } catch (error) {
      console.error('AI-enhanced guide generation failed:', error);
      alert('Guide generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadEnhancedGuide = (guide: AIEnhancedGuide) => {
    const content = {
      id: guide.id,
      title: guide.title,
      slug: guide.slug,
      species: guide.species,
      productId: guide.productId,
      sections: guide.sections,
      careEcosystem: guide.careEcosystem,
      smartBundles: guide.smartBundles,
      aiMetadata: guide.aiMetadata,
      metadata: {
        generatedAt: guide.createdAt,
        generator: 'Riverpark Catalog Tools AI',
        version: '2.0.0',
        format: 'riverpark-catalyst-ai-guide',
        productId: guide.productId,
        features: [
          'AI Product Recommendations',
          'Smart Bundles', 
          'UK-Specific Care',
          'Search Optimization'
        ]
      }
    };

    const dataStr = JSON.stringify(content, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.productId}-ai-care-guide.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderProductRecommendation = (product: ProductRecommendation) => (
    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
      <div>
        <div className="font-medium">{product.name}</div>
        <div className="text-gray-600">{product.reason}</div>
      </div>
      <div className="text-right">
        <div className="font-bold">£{product.price?.toFixed(2)}</div>
        <div className={`px-2 py-1 rounded text-xs ${
          product.importance === 'essential' ? 'bg-red-100 text-red-800' :
          product.importance === 'recommended' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {product.importance}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="semantic-section">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI-Enhanced Care Guide Generator</h1>
        <p className="text-gray-600">Generate intelligent care guides with product recommendations, smart bundles, and UK-specific advice.</p>
      </section>

      {/* AI Features Toggle */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Enhancement Options</h2>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={includeProductRecommendations}
              onChange={(e) => setIncludeProductRecommendations(e.target.checked)}
              className="rounded"
            />
            <div>
              <div className="font-medium">🛒 Product Recommendations</div>
              <div className="text-sm text-gray-600">AI matches products to fish care requirements</div>
            </div>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox" 
              checked={includeSmartBundles}
              onChange={(e) => setIncludeSmartBundles(e.target.checked)}
              className="rounded"
            />
            <div>
              <div className="font-medium">📦 Smart Bundles</div>
              <div className="text-sm text-gray-600">Create starter, complete, and advanced product bundles</div>
            </div>
          </label>
        </div>
      </section>

      {/* File Upload - Same as original */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Species Data</h2>
        <p className="text-gray-600 mb-4">Upload JSON files generated by the Species Generator to create AI-enhanced care guides.</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="text-gray-400 text-4xl">🤖</div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                Upload Species JSON
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Accepts JSON files from Species Generator
            </p>
          </div>
        </div>

        {uploadedSpeciesData.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-800 font-medium">
                Loaded {uploadedSpeciesData.length} species ready for AI enhancement
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Species Selection - Same as original */}
      {uploadedSpeciesData.length > 0 && (
        <section className="semantic-section">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Species for AI Enhancement</h2>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAllSpecies}
              className="btn-primary text-sm"
            >
              Select All ({uploadedSpeciesData.length})
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Clear Selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
            {uploadedSpeciesData.map(species => (
              <label key={species.productId} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={selectedSpecies.includes(species.productId)}
                  onChange={() => toggleSpecies(species.productId)}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">
                    ID: {species.productId}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {species.commonName}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Generation Controls */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate AI-Enhanced Care Guides</h2>
        
        {progress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{progress.currentSpecies} - {progress.currentStage}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={generateGuides}
          disabled={selectedSpecies.length === 0 || isGenerating}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating AI Guides...' : `Generate ${selectedSpecies.length} AI-Enhanced Guides`}
        </button>
      </section>

      {/* Generated Guides */}
      {generatedGuides.length > 0 && (
        <section className="semantic-section">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">AI-Enhanced Care Guides</h2>
            <div className="text-sm text-gray-600">
              {generatedGuides.length} guides with product recommendations
            </div>
          </div>

          <div className="space-y-6">
            {generatedGuides.map(guide => (
              <div key={guide.id} className="semantic-card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {guide.title}
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">AI Enhanced</span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {guide.sections.length} sections • Product recommendations • Smart bundles
                    </p>
                  </div>
                  
                  <button
                    onClick={() => downloadEnhancedGuide(guide)}
                    className="btn-primary text-sm ml-4"
                  >
                    Download AI JSON
                  </button>
                </div>

                {/* Smart Bundles Preview */}
                {guide.smartBundles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">🎁 Smart Bundles ({guide.smartBundles.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {guide.smartBundles.map(bundle => (
                        <div key={bundle.id} className="p-3 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-sm">{bundle.name}</div>
                            <div className="text-sm">
                              <span className="line-through text-gray-500">£{bundle.totalValue.toFixed(2)}</span>
                              <span className="font-bold text-green-600 ml-1">£{bundle.bundlePrice.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{bundle.description}</div>
                          <div className="flex justify-between text-xs">
                            <span>{bundle.products.length} products</span>
                            <span className="text-green-600 font-medium">Save £{bundle.savings.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Recommendations Preview */}
                {guide.careEcosystem.setup.filtration.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">🛒 Product Recommendations Sample</h4>
                    <div className="space-y-2">
                      {guide.careEcosystem.setup.filtration.slice(0, 2).map(renderProductRecommendation)}
                      {guide.careEcosystem.nutrition.food.slice(0, 1).map(renderProductRecommendation)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Features Info */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Revolutionary UK Aquatics Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">🤖 AI Product Matching</h3>
            <ul className="space-y-1 text-blue-700">
              <li>• Matches products to fish care requirements</li>
              <li>• UK-specific product recommendations</li>
              <li>• Tank size and compatibility analysis</li>
              <li>• Essential vs optional categorization</li>
            </ul>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">📦 Smart Bundle System</h3>
            <ul className="space-y-1 text-green-700">
              <li>• Automated starter, complete & advanced bundles</li>
              <li>• Intelligent pricing with savings calculations</li>
              <li>• Success rate predictions</li>
              <li>• Species-specific equipment matching</li>
            </ul>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-bold text-purple-800 mb-2">🇬🇧 UK Market Focus</h3>
            <ul className="space-y-1 text-purple-700">
              <li>• UK water condition compatibility</li>
              <li>• Energy cost considerations</li>
              <li>• Seasonal care recommendations</li>
              <li>• Local aquarist community integration</li>
            </ul>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-bold text-orange-800 mb-2">🎯 Cross-Selling Engine</h3>
            <ul className="space-y-1 text-orange-700">
              <li>• Increases dry goods sales</li>
              <li>• Reduces customer research time</li>
              <li>• Builds customer confidence</li>
              <li>• No other UK retailer has this!</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
'use client';

import { useState, useRef } from 'react';
import { getSpeciesFromDatabase } from '@/lib/speciesDatabase';
import { CatalogDatabase } from '@/lib/database';
import { GeneratedGuide, GuideSection, SpeciesData } from '@/types/catalog';
import * as XLSX from 'xlsx';

interface GenerationProgress {
  total: number;
  current: number;
  currentSpecies: string;
}

export function CareGuideGenerator() {
  const [uploadedSpeciesData, setUploadedSpeciesData] = useState<SpeciesData[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [generatedGuides, setGeneratedGuides] = useState<GeneratedGuide[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Handle both single species and array of species
      const speciesArray = Array.isArray(data) ? data : [data];
      setUploadedSpeciesData(speciesArray);
      setSelectedSpecies(speciesArray.map((s: SpeciesData) => s.productId));
    } catch (error) {
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

  const generateGuideFromSpeciesData = (speciesData: SpeciesData): GeneratedGuide => {
    const commonName = speciesData.commonName || 'Unknown Species';
    const species = getSpeciesFromDatabase(commonName);
    
    // Use database species info if available, otherwise use specifications from uploaded data
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

    return {
      id: crypto.randomUUID(),
      title: `Our Guide To Keeping ${specInfo.commonName}`,
      slug,
      species: commonName,
      productId: speciesData.productId,
      type: speciesData.type || 'care-guide',
      sections,
      createdAt: new Date().toISOString()
    };
  };

  const generateGuides = async () => {
    if (selectedSpecies.length === 0) return;

    setIsGenerating(true);
    setProgress({ total: selectedSpecies.length, current: 0, currentSpecies: '' });

    try {
      const guides: GeneratedGuide[] = [];

      for (let i = 0; i < selectedSpecies.length; i++) {
        const productId = selectedSpecies[i];
        const speciesData = uploadedSpeciesData.find(s => s.productId === productId);
        if (!speciesData) continue;

        setProgress({ total: selectedSpecies.length, current: i, currentSpecies: speciesData.commonName || 'Unknown' });

        const guide = generateGuideFromSpeciesData(speciesData);
        guides.push(guide);

        // Save individual guide
        await CatalogDatabase.saveGuide({
          id: guide.id,
          title: guide.title,
          slug: guide.slug,
          species: guide.species,
          content: guide.sections,
          createdAt: guide.createdAt
        });

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setGeneratedGuides(guides);
      setProgress({ total: selectedSpecies.length, current: selectedSpecies.length, currentSpecies: 'Complete' });

    } catch (error) {
      console.error('Guide generation failed:', error);
      alert('Guide generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadGuide = (guide: GeneratedGuide) => {
    const content = {
      id: guide.id,
      title: guide.title,
      slug: guide.slug,
      species: guide.species,
      productId: guide.productId,
      type: guide.type,
      sections: guide.sections,
      metadata: {
        generatedAt: guide.createdAt,
        generator: 'Riverpark Catalog Tools',
        version: '1.0.0',
        format: 'riverpark-catalyst-guide',
        productId: guide.productId
      }
    };

    const dataStr = JSON.stringify(content, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.productId || guide.slug}-care-guide.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Track download
    CatalogDatabase.trackDownload({
      sessionId: sessionId || 'unknown',
      fileName: `${guide.slug}-care-guide.json`,
      downloadedAt: new Date().toISOString(),
      fileType: 'guide'
    });
  };

  const downloadAllGuides = () => {
    const allGuides = {
      guides: generatedGuides.map(guide => ({
        id: guide.id,
        title: guide.title,
        slug: guide.slug,
        species: guide.species,
        productId: guide.productId,
        type: guide.type,
        sections: guide.sections
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        generator: 'Riverpark Catalog Tools',
        version: '1.0.0',
        format: 'riverpark-catalyst-guides-bulk',
        count: generatedGuides.length
      }
    };

    const dataStr = JSON.stringify(allGuides, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `care-guides-bulk-${generatedGuides.length}-species.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* File Upload */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Species Data</h2>
        <p className="text-gray-600 mb-4">Upload JSON files generated by the Species Generator to create care guides with productID-based filenames.</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="text-gray-400 text-4xl">📁</div>
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
                Loaded {uploadedSpeciesData.length} species with productIDs
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Species Selection */}
      {uploadedSpeciesData.length > 0 && (
        <section className="semantic-section">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Species for Care Guides</h2>
          
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

          <div className="mt-4 text-sm text-gray-600">
            Selected: {selectedSpecies.length} species → Filenames: {selectedSpecies.map(id => `${id}-care-guide.json`).join(', ')}
          </div>
        </section>
      )}

      {/* Generation Controls */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Care Guides</h2>
        
        {progress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Generating guides... {progress.currentSpecies}</span>
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
          {isGenerating ? 'Generating...' : `Generate ${selectedSpecies.length} Care Guides`}
        </button>
      </section>

      {/* Generated Guides */}
      {generatedGuides.length > 0 && (
        <section className="semantic-section">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Generated Care Guides</h2>
            <button
              onClick={downloadAllGuides}
              className="btn-success text-sm"
            >
              Download All JSON ({generatedGuides.length})
            </button>
          </div>

          <div className="space-y-4">
            {generatedGuides.map(guide => (
              <div key={guide.id} className="semantic-card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{guide.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {guide.sections.length} sections • Generated for riverpark-catalyst-fresh
                    </p>
                    
                    {/* Preview first section */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700">{guide.sections[0]?.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {guide.sections[0]?.content.substring(0, 150)}...
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => downloadGuide(guide)}
                    className="btn-primary text-sm ml-4"
                  >
                    Download JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Workflow Info */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-bold text-blue-600">1. Species Generator</div>
              <div className="text-gray-600">Excel → Enhanced JSON</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <span className="text-2xl">📖</span>
            <div>
              <div className="font-bold text-green-600">2. Upload JSON</div>
              <div className="text-gray-600">Load species data</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <span className="text-2xl">📋</span>
            <div>
              <div className="font-bold text-purple-600">3. Generate Guides</div>
              <div className="text-gray-600">ProductID-care-guide.json</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
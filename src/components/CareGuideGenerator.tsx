'use client';

import { useState, useRef } from 'react';
import { speciesDatabase, getSpeciesFromDatabase } from '@/lib/speciesDatabase';
import { CatalogDatabase } from '@/lib/database';
import { GeneratedGuide, GuideSection } from '@/types/catalog';

interface GenerationProgress {
  total: number;
  current: number;
  currentSpecies: string;
}

export function CareGuideGenerator() {
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [generatedGuides, setGeneratedGuides] = useState<GeneratedGuide[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allSpeciesNames = Object.keys(speciesDatabase);

  const toggleSpecies = (speciesName: string) => {
    setSelectedSpecies(prev => 
      prev.includes(speciesName) 
        ? prev.filter(s => s !== speciesName)
        : [...prev, speciesName]
    );
  };

  const selectAllSpecies = () => {
    setSelectedSpecies(allSpeciesNames);
  };

  const clearSelection = () => {
    setSelectedSpecies([]);
  };

  const generateGuideFromSpecies = (speciesName: string): GeneratedGuide => {
    const species = getSpeciesFromDatabase(speciesName);
    if (!species) {
      throw new Error(`Species not found: ${speciesName}`);
    }

    const slug = speciesName.toLowerCase().replace(/\s+/g, '-');
    const sections: GuideSection[] = [
      {
        title: "Species Overview",
        content: `The ${species.commonName} (${species.scientificName || 'Scientific name varies'}) is a ${species.careLevel.toLowerCase()} level aquarium fish from ${species.origin}. Known for their ${species.temperament.toLowerCase()} nature, these fish make ${species.temperament === 'Peaceful' ? 'excellent community tank residents' : species.temperament === 'Semi-Aggressive' ? 'suitable additions to carefully planned community tanks' : 'challenging but rewarding specimens for experienced aquarists'}.`
      },
      {
        title: "Tank Requirements",
        content: `${species.commonName} require a minimum tank size of ${species.minTankSize} to thrive. The aquarium should be well-established with stable water parameters and adequate swimming space. ${species.groupSize.includes('group') || species.groupSize.includes('school') ? `These fish are social and should be kept ${species.groupSize}.` : `${species.commonName} can be kept ${species.groupSize}.`}`
      },
      {
        title: "Water Parameters",
        content: `Maintain water temperature between ${species.temperatureRange} and pH levels of ${species.phRange}. Regular water changes of 20-25% weekly are essential for maintaining optimal water quality. Use a reliable heater and thermometer to ensure temperature stability.`
      },
      {
        title: "Diet and Feeding",
        content: `${species.commonName} are ${species.diet.toLowerCase()} and should be fed a varied diet appropriate to their nutritional needs. Feed small portions 2-3 times daily, only providing what can be consumed within 2-3 minutes. ${species.diet === 'Omnivore' ? 'Offer a mix of high-quality flakes, pellets, and occasional live or frozen foods.' : species.diet === 'Carnivore' ? 'Provide protein-rich foods including live or frozen bloodworms, brine shrimp, and quality carnivore pellets.' : 'Focus on plant-based foods including algae wafers, blanched vegetables, and quality herbivore pellets.'}`
      },
      {
        title: "Tank Mates and Compatibility",
        content: `${species.commonName} are ${species.temperament.toLowerCase()} fish that ${species.compatibility.length > 0 ? `work well with ${species.compatibility.slice(0, 3).join(', ')}${species.compatibility.length > 3 ? ' and other compatible species' : ''}` : 'require careful tank mate selection'}. ${species.temperament === 'Peaceful' ? 'They can be housed with most other peaceful community fish of similar size.' : species.temperament === 'Semi-Aggressive' ? 'Choose tank mates carefully, avoiding very small or overly aggressive species.' : 'Best kept with other robust fish that can handle their assertive nature.'}`
      },
      {
        title: "Health and Common Issues",
        content: `${species.commonName} are generally hardy fish when provided with proper care. Watch for signs of stress including loss of appetite, lethargy, or unusual swimming patterns. Common issues include ich, fin rot, and water quality-related stress. ${species.specialRequirements ? `Special considerations: ${species.specialRequirements.join(', ')}.` : ''} Maintain excellent water quality and quarantine new additions to prevent disease introduction.`
      },
      {
        title: "Breeding and Reproduction",
        content: `${species.commonName} ${species.family === 'Cichlidae' ? 'are substrate spawners that may breed readily in the home aquarium. Provide flat stones or caves for spawning sites and be prepared to separate breeding pairs if aggression increases.' : species.family === 'Poeciliidae' ? 'are livebearers that reproduce easily in the aquarium. Females can produce 20-50 fry every 4-6 weeks. Provide dense vegetation or breeding boxes to protect fry.' : 'can be bred in the home aquarium with proper conditions. Research specific breeding requirements for this species and provide appropriate spawning conditions.'} Breeding success often indicates excellent water quality and proper nutrition.`
      }
    ];

    return {
      id: crypto.randomUUID(),
      title: `Our Guide To Keeping ${species.commonName}`,
      slug,
      species: speciesName,
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
        const speciesName = selectedSpecies[i];
        setProgress({ total: selectedSpecies.length, current: i, currentSpecies: speciesName });

        const guide = generateGuideFromSpecies(speciesName);
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
      sections: guide.sections,
      metadata: {
        generatedAt: guide.createdAt,
        generator: 'Riverpark Catalog Tools',
        version: '1.0.0',
        format: 'riverpark-catalyst-guide'
      }
    };

    const dataStr = JSON.stringify(content, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.slug}-care-guide.json`;
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
      {/* Species Selection */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Species for Care Guides</h2>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={selectAllSpecies}
            className="btn-primary text-sm"
          >
            Select All ({allSpeciesNames.length})
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Clear Selection
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto border rounded-lg p-4">
          {allSpeciesNames.map(speciesName => (
            <label key={speciesName} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={selectedSpecies.includes(speciesName)}
                onChange={() => toggleSpecies(speciesName)}
                className="rounded"
              />
              <span className="capitalize">{speciesName}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Selected: {selectedSpecies.length} species
        </div>
      </section>

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

      {/* Species Database Info */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Species Database</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{allSpeciesNames.length}</div>
            <div className="text-gray-600">Total Species</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">7</div>
            <div className="text-gray-600">Guide Sections</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">JSON</div>
            <div className="text-gray-600">Export Format</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">Pro</div>
            <div className="text-gray-600">Quality Level</div>
          </div>
        </div>
      </section>
    </div>
  );
}
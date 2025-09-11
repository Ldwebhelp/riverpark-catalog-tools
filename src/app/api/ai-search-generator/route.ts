import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

interface GenerateAISearchRequest {
  productId: string;
  name: string;
  scientificName?: string;
  commonName?: string;
  provider?: 'openai';
  realProductData?: BigCommerceProduct;
}

interface BigCommerceProduct {
  entityId: number;
  name: string;
  sku?: string;
  description?: string;
  plainTextDescription?: string;
  brand?: {
    name: string;
  } | null;
  prices?: {
    price?: {
      value: number;
      currencyCode: string;
    };
  } | null;
}

interface AISearchData {
  productId: number;
  type: string;
  version: string;
  basicInfo: {
    scientificName: string;
    commonNames: string[];
    category: string;
    family: string;
    origin: string;
    waterType: string;
  };
  searchKeywords: string[];
  careRequirements: {
    minTankSize: string;
    temperatureRange: string;
    phRange: string;
    maxSize: string;
    diet: string;
    careLevel: string;
    temperament: string;
    socialNeeds: string;
    lifespan: string;
  };
  compatibility: {
    compatibleWith: string[];
    avoidWith: string[];
    tankMateCategories: string[];
  };
  aiContext: {
    whyPopular: string;
    keySellingPoints: string[];
    commonQuestions: Array<{
      question: string;
      answer: string;
    }>;
    alternativeNames: string[];
  };
  relatedProducts: {
    complementaryProducts: string[];
    similarSpecies: string[];
  };
  breeding: {
    breedingType: string;
    breedingDifficulty: string;
    breedingNotes: string;
  };
  metadata: {
    generatedAt: string;
    lastUpdated: string;
    confidence: string;
    sources: string[];
  };
}

interface SpeciesData {
  productId: number;
  type: string;
  version: string;
  title: string;
  quickReference: string[];
  basicInfo: {
    scientificName: string;
    commonNames: string[];
    category: string;
    family: string;
    origin: string;
    waterType: string;
  };
  careRequirements: {
    minTankSize: string;
    temperatureRange: string;
    phRange: string;
    maxSize: string;
    diet: string;
    careLevel: string;
    temperament: string;
    socialNeeds: string;
    lifespan: string;
  };
  compatibility: {
    compatibleWith: string[];
    avoidWith: string[];
    tankMateCategories: string[];
  };
  breeding: {
    breedingType: string;
    breedingDifficulty: string;
    breedingNotes: string;
  };
  metadata: {
    generatedAt: string;
    lastUpdated: string;
    confidence: string;
    sources: string[];
  };
}

// Fetch BigCommerce product data from riverpark-catalyst-fresh
async function fetchBigCommerceProductData(productId: string): Promise<BigCommerceProduct | null> {
  try {
    const response = await fetch(`https://riverpark-catalyst-fresh.vercel.app/api/product/${productId}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch product ${productId}: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch BigCommerce product:', error);
    return null;
  }
}

// Generate AI search data using OpenAI
async function generateWithOpenAI(request: GenerateAISearchRequest): Promise<AISearchData> {
  const productData = request.realProductData;
  
  if (!productData) {
    throw new Error('Real product data is required for AI generation');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const scientificName = request.scientificName || extractScientificName(productData.name) || 'Unknown species';
  const commonName = request.commonName || extractCommonName(productData.name) || productData.name;

  const prompt = buildAISearchPrompt({
    productId: request.productId,
    name: productData.name,
    scientificName,
    commonName,
    description: productData.plainTextDescription || productData.description,
    brand: productData.brand?.name,
    price: productData.prices?.price?.value
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert aquarium specialist and e-commerce search optimization expert. You create comprehensive, accurate species data that enhances product discoverability and provides valuable customer information. Always use UK metric measurements and provide detailed, accurate information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response content from OpenAI');
    }

    // Extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in OpenAI response');
    }

    const aiSearchData: Partial<AISearchData> = JSON.parse(jsonMatch[0]);
    
    // Ensure all required fields are present
    const completeData: AISearchData = {
      productId: parseInt(request.productId),
      type: 'ai-search',
      version: '1.0',
      basicInfo: aiSearchData.basicInfo || {
        scientificName,
        commonNames: [commonName],
        category: 'Unknown Category',
        family: 'Unknown Family',
        origin: 'Unknown Origin',
        waterType: 'Freshwater'
      },
      searchKeywords: aiSearchData.searchKeywords || [],
      careRequirements: aiSearchData.careRequirements || {
        minTankSize: '75L',
        temperatureRange: '22-26°C',
        phRange: '6.5-7.5',
        maxSize: '8cm',
        diet: 'Omnivore',
        careLevel: 'Intermediate',
        temperament: 'Peaceful',
        socialNeeds: 'Group of 3+',
        lifespan: '3-5 years'
      },
      compatibility: aiSearchData.compatibility || {
        compatibleWith: [],
        avoidWith: [],
        tankMateCategories: []
      },
      aiContext: aiSearchData.aiContext || {
        whyPopular: 'Popular aquarium species with attractive characteristics.',
        keySellingPoints: [],
        commonQuestions: [],
        alternativeNames: []
      },
      relatedProducts: aiSearchData.relatedProducts || {
        complementaryProducts: [],
        similarSpecies: []
      },
      breeding: aiSearchData.breeding || {
        breedingType: 'Unknown',
        breedingDifficulty: 'Moderate',
        breedingNotes: 'Please consult species-specific breeding guides.'
      },
      metadata: {
        generatedAt: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB'),
        lastUpdated: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB'),
        confidence: 'high',
        sources: ['BigCommerce Product Data', 'OpenAI GPT-4', 'Aquarium Care Databases']
      }
    };

    return completeData;

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate AI search data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildAISearchPrompt(data: {
  productId: string;
  name: string;
  scientificName: string;
  commonName: string;
  description?: string;
  brand?: string;
  price?: number;
}): string {
  return `Generate comprehensive AI search data for this aquarium fish product using REAL BIGCOMMERCE DATA:

REAL PRODUCT DATA:
Product ID: ${data.productId}
Product Name: ${data.name}
Scientific Name: ${data.scientificName}
Common Name: ${data.commonName}
Brand: ${data.brand || 'Unknown'}
Price: ${data.price ? `£${data.price}` : 'Unknown'}
Description: ${data.description || 'No description available'}

Create a comprehensive AI search data structure that will help customers find this product and understand its care requirements. Use ONLY UK metric measurements.

Return ONLY a JSON object in this EXACT format:

{
  "basicInfo": {
    "scientificName": "${data.scientificName}",
    "commonNames": ["${data.commonName}", "alternative names..."],
    "category": "Fish category (e.g., Lake Malawi Cichlid, Community Fish)",
    "family": "Fish family name",
    "origin": "Geographic origin",
    "waterType": "Freshwater"
  },
  "searchKeywords": [
    "List of 10-15 search terms customers might use",
    "Include scientific name variations",
    "Common name variations", 
    "Care difficulty terms",
    "Color descriptions",
    "Behavior terms"
  ],
  "careRequirements": {
    "minTankSize": "Size in litres (e.g., '120L')",
    "temperatureRange": "Range in Celsius (e.g., '24-28°C')",
    "phRange": "pH range (e.g., '7.5-8.5')",
    "maxSize": "Adult size in cm (e.g., '10cm')",
    "diet": "Carnivore/Omnivore/Herbivore",
    "careLevel": "Beginner/Intermediate/Expert",
    "temperament": "Peaceful/Semi-aggressive/Aggressive",
    "socialNeeds": "Schooling needs (e.g., 'Group of 3+', '1 fish only')",
    "lifespan": "Expected lifespan (e.g., '5-8 years')"
  },
  "compatibility": {
    "compatibleWith": ["List of 3-5 compatible species or categories"],
    "avoidWith": ["List of 3-5 incompatible species or categories"],
    "tankMateCategories": ["Broader categories of suitable tank mates"]
  },
  "aiContext": {
    "whyPopular": "1-2 sentence explanation of why this species is popular",
    "keySellingPoints": [
      "List 4-6 key selling points",
      "Focus on unique characteristics",
      "Care benefits",
      "Visual appeal"
    ],
    "commonQuestions": [
      {
        "question": "Are [species] aggressive?",
        "answer": "Accurate answer about temperament"
      },
      {
        "question": "What tank mates work with [species]?",
        "answer": "Tank mate recommendations"
      },
      {
        "question": "What size tank do [species] need?",
        "answer": "Tank size requirements"
      },
      {
        "question": "Are [species] good for beginners?",
        "answer": "Beginner suitability assessment"
      }
    ],
    "alternativeNames": ["List alternative names customers might search for"]
  },
  "relatedProducts": {
    "complementaryProducts": [
      "Fish food types",
      "Tank equipment",
      "Water treatments",
      "Decorations",
      "Other care products"
    ],
    "similarSpecies": ["3-4 similar or related species"]
  },
  "breeding": {
    "breedingType": "Egg scatterer/Mouthbrooder/Livebearer/etc",
    "breedingDifficulty": "Easy/Moderate/Difficult",
    "breedingNotes": "Brief breeding information"
  }
}

CRITICAL REQUIREMENTS:
- Use ONLY UK metric measurements (Celsius, litres, centimetres)
- Be specific and accurate for this exact species
- Include comprehensive search keywords
- Provide practical care advice
- Focus on customer questions and needs
- Return ONLY valid JSON, no additional text`;
}

function extractScientificName(productName: string): string | null {
  const scientificMatch = productName.match(/\(([A-Z][a-z]+\s+[a-z]+)\)/);
  if (scientificMatch) {
    return scientificMatch[1] || null;
  }
  
  const directMatch = productName.match(/^([A-Z][a-z]+\s+[a-z]+)/);
  if (directMatch) {
    return directMatch[1] || null;
  }
  
  return null;
}

function extractCommonName(productName: string): string | null {
  const commonName = productName
    .replace(/\([^)]+\)/g, '')
    .replace(/\d+cm/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  
  return commonName || null;
}

// Create species data from AI search data (Quick Reference content)
function createSpeciesData(aiSearchData: AISearchData): SpeciesData {
  // Create Quick Reference bullet points from AI search data
  const quickReference = [
    `Minimum tank size: ${aiSearchData.careRequirements.minTankSize} for a small group`,
    `Ideal pH: ${aiSearchData.careRequirements.phRange} (${aiSearchData.basicInfo.category} conditions)`,
    `Temperature: ${aiSearchData.careRequirements.temperatureRange} consistently maintained`,
    `Diet: ${aiSearchData.careRequirements.diet} - quality pellets plus variety`,
    `Social: ${aiSearchData.careRequirements.socialNeeds} for best results`,
    `Compatibility: ${aiSearchData.careRequirements.temperament} with other ${aiSearchData.basicInfo.category}`,
    `Breeding: ${aiSearchData.breeding.breedingType} - ${aiSearchData.breeding.breedingDifficulty.toLowerCase()}`
  ];

  return {
    productId: aiSearchData.productId,
    type: 'species',
    version: '1.0',
    title: 'Quick Reference',
    quickReference: quickReference,
    basicInfo: aiSearchData.basicInfo,
    careRequirements: aiSearchData.careRequirements,
    compatibility: aiSearchData.compatibility,
    breeding: aiSearchData.breeding,
    metadata: {
      generatedAt: aiSearchData.metadata.generatedAt,
      lastUpdated: aiSearchData.metadata.lastUpdated,
      confidence: aiSearchData.metadata.confidence,
      sources: aiSearchData.metadata.sources
    }
  };
}

// Files are saved directly to the Catalyst project filesystem via the storage API
// No external API calls needed - local filesystem access is more reliable

export async function POST(request: NextRequest) {
  try {
    const body: GenerateAISearchRequest = await request.json();
    
    if (!body.productId || !body.name) {
      const errorResponse = NextResponse.json(
        { error: 'productId and name are required' },
        { status: 400 }
      );
      
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return errorResponse;
    }

    console.log('Generating AI search data for:', body);

    // Use provided product data or fetch from BigCommerce
    let realProductData: BigCommerceProduct | undefined = body.realProductData;
    if (!realProductData) {
      const fetchedData = await fetchBigCommerceProductData(body.productId);
      if (!fetchedData) {
        const errorResponse = NextResponse.json(
          { error: 'Product not found in BigCommerce' },
          { status: 404 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        return errorResponse;
      }
      realProductData = fetchedData;
    }

    // Generate AI search data
    const aiSearchData = await generateWithOpenAI({
      ...body,
      realProductData
    });

    // Create species data from AI search data
    const speciesData = createSpeciesData(aiSearchData);

    // Note: Files are automatically saved to Catalyst project via the storage API below
    console.log('✅ AI search data generated, proceeding to save to filesystem and database');

    // Store both files in database and local file system
    try {
      // Store AI search data
      const storeAIResponse = await fetch(`${request.nextUrl.origin}/api/ai-content/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: aiSearchData.productId,
          contentType: 'ai-search',
          contentData: aiSearchData,
          autoSave: true
        }),
      });

      // Store species data
      const storeSpeciesResponse = await fetch(`${request.nextUrl.origin}/api/ai-content/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: speciesData.productId,
          contentType: 'species',
          contentData: speciesData,
          autoSave: true
        }),
      });

      if (storeAIResponse.ok && storeSpeciesResponse.ok) {
        const aiResult = await storeAIResponse.json();
        const speciesResult = await storeSpeciesResponse.json();
        console.log('✅ Stored AI content in database and files:', aiResult.paths);
        console.log('✅ Stored species content in database and files:', speciesResult.paths);
      } else {
        console.warn('❌ Failed to store content in database/files');
      }
    } catch (error) {
      console.warn('❌ Error storing content:', error);
    }

    console.log('Generated AI search data:', aiSearchData);

    const response = NextResponse.json(aiSearchData);
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('Error generating AI search data:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to generate AI search data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}
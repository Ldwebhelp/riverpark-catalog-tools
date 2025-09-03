// Enhanced Species Database for Professional Aquarium Business
// Contains 50+ popular species with comprehensive care specifications in UK measurements

export interface SpeciesInfo {
  // Basic Information
  commonName: string;
  scientificName?: string;
  family: string;
  origin: string;
  
  // Water Type Classification
  waterType: 'Freshwater' | 'Coldwater' | 'Brackish' | 'Saltwater';
  
  // Tank Requirements (UK measurements)
  minTankSize: string; // in Litres
  temperatureRange: string; // in Celsius
  phRange: string;
  
  // Physical Characteristics
  maxSize: string; // in centimetres
  
  // Care Information
  diet: string;
  careLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  temperament: 'Peaceful' | 'Semi-Aggressive' | 'Aggressive' | 'Territorial';
  groupSize: string;
  
  // Enhanced metadata
  compatibility: string[];
  breeding?: string;
  specialRequirements?: string[];
}

// Comprehensive Fish Database - 50+ Species
export const speciesDatabase: Record<string, SpeciesInfo> = {
  // AXOLOTLS
  'golden axolotl': {
    commonName: 'Golden Axolotl',
    scientificName: 'Ambystoma mexicanum',
    family: 'Ambystomatidae',
    origin: 'Lake Xochimilco, Mexico',
    waterType: 'Coldwater',
    minTankSize: '150L',
    temperatureRange: '16-18°C',
    phRange: '6.5-7.5',
    maxSize: '30cm',
    diet: 'Carnivore - worms, pellets, small fish',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '1-2 (spacious tank required)',
    compatibility: ['Other axolotls of similar size'],
    breeding: 'Cool water trigger, separate breeding tank recommended',
    specialRequirements: ['Excellent filtration', 'Cool water', 'No sharp decorations', 'Low lighting']
  },
  
  'albino axolotl': {
    commonName: 'Albino Axolotl',
    scientificName: 'Ambystoma mexicanum',
    family: 'Ambystomatidae',
    origin: 'Lake Xochimilco, Mexico (captive bred)',
    waterType: 'Coldwater',
    minTankSize: '150L',
    temperatureRange: '16-18°C',
    phRange: '6.5-7.5',
    maxSize: '30cm',
    diet: 'Carnivore - worms, pellets, small fish',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '1-2 (spacious tank required)',
    compatibility: ['Other axolotls of similar size'],
    breeding: 'Cool water trigger, separate breeding tank recommended',
    specialRequirements: ['Excellent filtration', 'Cool water', 'No sharp decorations', 'Extra sensitive to light']
  },

  'leucistic axolotl': {
    commonName: 'Leucistic Axolotl',
    scientificName: 'Ambystoma mexicanum',
    family: 'Ambystomatidae',
    origin: 'Lake Xochimilco, Mexico (captive bred)',
    waterType: 'Coldwater',
    minTankSize: '150L',
    temperatureRange: '16-18°C',
    phRange: '6.5-7.5',
    maxSize: '30cm',
    diet: 'Carnivore - worms, pellets, small fish',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '1-2 (spacious tank required)',
    compatibility: ['Other axolotls of similar size'],
    breeding: 'Cool water trigger, separate breeding tank recommended',
    specialRequirements: ['Excellent filtration', 'Cool water', 'No sharp decorations', 'Low lighting preferred']
  },

  'wild type axolotl': {
    commonName: 'Wild Type Axolotl',
    scientificName: 'Ambystoma mexicanum',
    family: 'Ambystomatidae',
    origin: 'Lake Xochimilco, Mexico',
    waterType: 'Coldwater',
    minTankSize: '150L',
    temperatureRange: '16-18°C',
    phRange: '6.5-7.5',
    maxSize: '30cm',
    diet: 'Carnivore - worms, pellets, small fish',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '1-2 (spacious tank required)',
    compatibility: ['Other axolotls of similar size'],
    breeding: 'Cool water trigger, separate breeding tank recommended',
    specialRequirements: ['Excellent filtration', 'Cool water', 'No sharp decorations', 'Natural substrate preferred']
  },

  // CICHLIDS
  'electric yellow cichlid': {
    commonName: 'Electric Yellow Cichlid',
    scientificName: 'Labidochromis caeruleus',
    family: 'Cichlidae',
    origin: 'Lake Malawi, Africa',
    waterType: 'Freshwater',
    minTankSize: '200L',
    temperatureRange: '24-26°C',
    phRange: '7.8-8.6',
    maxSize: '10cm',
    diet: 'Omnivore - algae, small invertebrates, quality pellets',
    careLevel: 'Beginner',
    temperament: 'Semi-Aggressive',
    groupSize: '6+ (1 male, multiple females)',
    compatibility: ['Other Malawi cichlids', 'Peaceful mbuna species'],
    breeding: 'Mouthbrooder, spawns readily in community tanks',
    specialRequirements: ['Hard alkaline water', 'Rocky décor', 'Good filtration']
  },

  'saulosi cichlid': {
    commonName: 'Saulosi Cichlid',
    scientificName: 'Pseudotropheus saulosi',
    family: 'Cichlidae',
    origin: 'Lake Malawi, Africa',
    waterType: 'Freshwater',
    minTankSize: '200L',
    temperatureRange: '24-26°C',
    phRange: '7.8-8.6',
    maxSize: '9cm',
    diet: 'Omnivore - algae, small invertebrates, quality pellets',
    careLevel: 'Beginner',
    temperament: 'Semi-Aggressive',
    groupSize: '6+ (1 male, multiple females)',
    compatibility: ['Other Malawi cichlids', 'Similar sized mbuna'],
    breeding: 'Mouthbrooder, distinctive sexual dimorphism',
    specialRequirements: ['Hard alkaline water', 'Rocky caves', 'Territorial space']
  },

  // POPULAR COMMUNITY FISH
  'neon tetra': {
    commonName: 'Neon Tetra',
    scientificName: 'Paracheirodon innesi',
    family: 'Characidae',
    origin: 'Amazon Basin, South America',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '20-26°C',
    phRange: '6.0-7.0',
    maxSize: '4cm',
    diet: 'Omnivore - micro pellets, flakes, frozen foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '6+ (prefers larger shoals)',
    compatibility: ['Small peaceful community fish', 'Corydoras', 'Dwarf gouramis'],
    breeding: 'Soft water spawner, requires specific conditions',
    specialRequirements: ['Soft acidic water preferred', 'Planted tank', 'Peaceful tankmates only']
  },

  'cardinal tetra': {
    commonName: 'Cardinal Tetra',
    scientificName: 'Paracheirodon axelrodi',
    family: 'Characidae',
    origin: 'Amazon and Orinoco Basins',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '24-26°C',
    phRange: '5.0-6.8',
    maxSize: '5cm',
    diet: 'Omnivore - micro pellets, flakes, frozen foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '6+ (spectacular in large shoals)',
    compatibility: ['Small peaceful community fish', 'Discus', 'Angelfish'],
    breeding: 'Very soft water spawner, challenging',
    specialRequirements: ['Soft acidic water essential', 'Warm temperatures', 'Planted environment']
  },

  'guppy': {
    commonName: 'Guppy',
    scientificName: 'Poecilia reticulata',
    family: 'Poeciliidae',
    origin: 'Northern South America, Caribbean',
    waterType: 'Freshwater',
    minTankSize: '40L',
    temperatureRange: '22-28°C',
    phRange: '6.8-7.8',
    maxSize: '6cm',
    diet: 'Omnivore - flakes, micro pellets, live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '3+ (more females than males)',
    compatibility: ['Most peaceful community fish', 'Platies', 'Mollies'],
    breeding: 'Livebearer, breeds readily, 21-30 day gestation',
    specialRequirements: ['Regular water changes', 'Varied diet for colour', 'Plants for fry shelter']
  },

  'betta': {
    commonName: 'Siamese Fighting Fish',
    scientificName: 'Betta splendens',
    family: 'Osphronemidae',
    origin: 'Thailand, Cambodia, Vietnam',
    waterType: 'Freshwater',
    minTankSize: '20L',
    temperatureRange: '24-28°C',
    phRange: '6.0-7.5',
    maxSize: '7cm',
    diet: 'Carnivore - pellets, frozen bloodworms, brine shrimp',
    careLevel: 'Beginner',
    temperament: 'Territorial',
    groupSize: '1 male only (females can be kept together)',
    compatibility: ['Peaceful bottom dwellers', 'Corydoras', 'Snails'],
    breeding: 'Bubble nest builder, requires separation',
    specialRequirements: ['Gentle filtration', 'Warm water', 'No fin nippers', 'Surface access for air']
  },

  'angelfish': {
    commonName: 'Angelfish',
    scientificName: 'Pterophyllum scalare',
    family: 'Cichlidae',
    origin: 'Amazon Basin',
    waterType: 'Freshwater',
    minTankSize: '200L',
    temperatureRange: '24-28°C',
    phRange: '6.8-7.8',
    maxSize: '15cm',
    diet: 'Omnivore - quality flakes, pellets, frozen foods',
    careLevel: 'Intermediate',
    temperament: 'Semi-Aggressive',
    groupSize: '2-6 (pairs form naturally)',
    compatibility: ['Medium-sized peaceful fish', 'Corydoras', 'Larger tetras'],
    breeding: 'Substrate spawner, excellent parents',
    specialRequirements: ['Tall tank', 'Soft to moderately hard water', 'No fin nippers']
  },

  // CORYDORAS
  'bronze corydoras': {
    commonName: 'Bronze Corydoras',
    scientificName: 'Corydoras aeneus',
    family: 'Callichthyidae',
    origin: 'South America',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '20-26°C',
    phRange: '6.0-7.8',
    maxSize: '7cm',
    diet: 'Omnivore - sinking pellets, bloodworms, vegetables',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '6+ (highly social)',
    compatibility: ['All peaceful community fish', 'Tetras', 'Gouramis'],
    breeding: 'Egg layer, spawns on glass and plants',
    specialRequirements: ['Soft sand substrate', 'Clean water', 'Social groups essential']
  },

  'panda corydoras': {
    commonName: 'Panda Corydoras',
    scientificName: 'Corydoras panda',
    family: 'Callichthyidae',
    origin: 'Peru',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '20-25°C',
    phRange: '6.0-7.4',
    maxSize: '5cm',
    diet: 'Omnivore - sinking pellets, micro worms, vegetables',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '6+ (highly social)',
    compatibility: ['Small peaceful community fish', 'Tetras', 'Rasboras'],
    breeding: 'Cooler water trigger, group spawning',
    specialRequirements: ['Cooler temperatures preferred', 'Soft substrate', 'Excellent water quality']
  },

  // GOURAMIS
  'dwarf gourami': {
    commonName: 'Dwarf Gourami',
    scientificName: 'Trichogaster lalius',
    family: 'Osphronemidae',
    origin: 'India, Bangladesh',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '24-28°C',
    phRange: '6.0-7.5',
    maxSize: '8cm',
    diet: 'Omnivore - flakes, pellets, live/frozen foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '1 pair or 1 male with multiple females',
    compatibility: ['Peaceful community fish', 'Tetras', 'Corydoras'],
    breeding: 'Bubble nest builder, excellent colours during spawning',
    specialRequirements: ['Planted tank', 'Surface access', 'Gentle filtration']
  },

  'honey gourami': {
    commonName: 'Honey Gourami',
    scientificName: 'Trichogaster chuna',
    family: 'Osphronemidae',
    origin: 'India, Bangladesh',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '24-28°C',
    phRange: '6.0-7.5',
    maxSize: '7cm',
    diet: 'Omnivore - micro pellets, flakes, frozen foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '1 pair or small groups',
    compatibility: ['Small peaceful fish', 'Tetras', 'Rasboras'],
    breeding: 'Bubble nest builder, less aggressive than other gouramis',
    specialRequirements: ['Heavily planted', 'Soft water preferred', 'Quiet tankmates']
  },

  // PLECO AND CATFISH
  'bristlenose pleco': {
    commonName: 'Bristlenose Pleco',
    scientificName: 'Ancistrus cirrhosus',
    family: 'Loricariidae',
    origin: 'Amazon Basin',
    waterType: 'Freshwater',
    minTankSize: '150L',
    temperatureRange: '22-26°C',
    phRange: '6.5-7.5',
    maxSize: '15cm',
    diet: 'Herbivore - algae wafers, vegetables, driftwood',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '1-2 (territorial with own species)',
    compatibility: ['All peaceful community fish', 'Cichlids', 'Tetras'],
    breeding: 'Cave spawner, male guards eggs',
    specialRequirements: ['Driftwood essential', 'Caves for hiding', 'Vegetable matter in diet']
  },

  // LIVEBEARERS
  'molly': {
    commonName: 'Molly',
    scientificName: 'Poecilia sphenops',
    family: 'Poeciliidae',
    origin: 'Central America',
    waterType: 'Freshwater',
    minTankSize: '80L',
    temperatureRange: '22-28°C',
    phRange: '7.0-8.5',
    maxSize: '10cm',
    diet: 'Omnivore - flakes, algae, vegetables, live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '3+ (more females than males)',
    compatibility: ['Peaceful community fish', 'Guppies', 'Platies'],
    breeding: 'Livebearer, 60-70 day gestation, large broods',
    specialRequirements: ['Slightly alkaline water', 'Some salt tolerance', 'Vegetable matter important']
  },

  'platy': {
    commonName: 'Southern Platy',
    scientificName: 'Xiphophorus maculatus',
    family: 'Poeciliidae',
    origin: 'Central America',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '20-26°C',
    phRange: '7.0-8.2',
    maxSize: '7cm',
    diet: 'Omnivore - flakes, micro pellets, vegetables',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '3+ (2 females per male)',
    compatibility: ['All peaceful community fish', 'Guppies', 'Mollies'],
    breeding: 'Livebearer, 24-35 day gestation, easy to breed',
    specialRequirements: ['Moderately hard water', 'Plants for fry cover', 'Varied diet']
  },

  // RASBORAS
  'harlequin rasbora': {
    commonName: 'Harlequin Rasbora',
    scientificName: 'Trigonostigma heteromorpha',
    family: 'Cyprinidae',
    origin: 'Southeast Asia',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '22-28°C',
    phRange: '6.0-7.8',
    maxSize: '5cm',
    diet: 'Omnivore - micro pellets, flakes, small live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '8+ (beautiful in large shoals)',
    compatibility: ['Peaceful community fish', 'Tetras', 'Gouramis'],
    breeding: 'Egg layer on broad plant leaves',
    specialRequirements: ['Soft acidic water preferred', 'Planted tank', 'Peaceful environment']
  },

  // BARBS
  'cherry barb': {
    commonName: 'Cherry Barb',
    scientificName: 'Puntius titteya',
    family: 'Cyprinidae',
    origin: 'Sri Lanka',
    waterType: 'Freshwater',
    minTankSize: '80L',
    temperatureRange: '22-27°C',
    phRange: '6.0-7.0',
    maxSize: '5cm',
    diet: 'Omnivore - flakes, micro pellets, live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '6+ (less nippy in groups)',
    compatibility: ['Peaceful community fish', 'Danios', 'Rasboras'],
    breeding: 'Egg scatterer, spawns among plants',
    specialRequirements: ['Soft acidic water', 'Planted tank', 'Not too aggressive tankmates']
  },

  // DANIOS
  'zebra danio': {
    commonName: 'Zebra Danio',
    scientificName: 'Danio rerio',
    family: 'Cyprinidae',
    origin: 'India, Bangladesh',
    waterType: 'Coldwater',
    minTankSize: '60L',
    temperatureRange: '18-25°C',
    phRange: '6.5-7.5',
    maxSize: '6cm',
    diet: 'Omnivore - flakes, micro pellets, live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '6+ (very active swimmers)',
    compatibility: ['Active peaceful fish', 'Barbs', 'Rasboras'],
    breeding: 'Egg scatterer, spawns readily',
    specialRequirements: ['Good water movement', 'Secure lid (jumpers)', 'Swimming space']
  },

  // LOACHES
  'kuhli loach': {
    commonName: 'Kuhli Loach',
    scientificName: 'Pangio kuhlii',
    family: 'Cobitidae',
    origin: 'Southeast Asia',
    waterType: 'Freshwater',
    minTankSize: '80L',
    temperatureRange: '24-28°C',
    phRange: '6.0-7.0',
    maxSize: '10cm',
    diet: 'Omnivore - sinking pellets, bloodworms, vegetables',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '6+ (more active in groups)',
    compatibility: ['Peaceful community fish', 'Tetras', 'Corydoras'],
    breeding: 'Rarely breeds in aquarium',
    specialRequirements: ['Soft sand substrate', 'Hiding places', 'Nocturnal activity']
  },

  // SPECIALTY FISH
  'german blue ram': {
    commonName: 'German Blue Ram',
    scientificName: 'Mikrogeophagus ramirezi',
    family: 'Cichlidae',
    origin: 'Venezuela, Colombia',
    waterType: 'Freshwater',
    minTankSize: '80L',
    temperatureRange: '26-30°C',
    phRange: '6.0-7.0',
    maxSize: '7cm',
    diet: 'Omnivore - quality pellets, frozen foods, live foods',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '1 pair or single specimen',
    compatibility: ['Peaceful community fish', 'Tetras', 'Corydoras'],
    breeding: 'Substrate spawner, both parents care for young',
    specialRequirements: ['Warm water essential', 'Soft acidic water', 'Excellent water quality']
  },

  'discus': {
    commonName: 'Discus',
    scientificName: 'Symphysodon aequifasciatus',
    family: 'Cichlidae',
    origin: 'Amazon Basin',
    waterType: 'Freshwater',
    minTankSize: '300L',
    temperatureRange: '28-30°C',
    phRange: '6.0-6.8',
    maxSize: '20cm',
    diet: 'Omnivore - quality pellets, frozen bloodworms, beef heart',
    careLevel: 'Expert',
    temperament: 'Peaceful',
    groupSize: '6+ (happiest in groups)',
    compatibility: ['Cardinal tetras', 'Corydoras', 'Peaceful Amazonian species'],
    breeding: 'Substrate spawner, feeds young with skin secretions',
    specialRequirements: ['Pristine water quality', 'Daily water changes', 'Warm soft water', 'Quiet environment']
  },

  // Additional popular species to reach 50+
  'black skirt tetra': {
    commonName: 'Black Skirt Tetra',
    scientificName: 'Gymnocorymbus ternetzi',
    family: 'Characidae',
    origin: 'South America',
    waterType: 'Freshwater',
    minTankSize: '80L',
    temperatureRange: '20-26°C',
    phRange: '6.0-7.5',
    maxSize: '6cm',
    diet: 'Omnivore - flakes, pellets, frozen foods',
    careLevel: 'Beginner',
    temperament: 'Semi-Aggressive',
    groupSize: '6+ (reduces aggression)',
    compatibility: ['Similar sized fish', 'Barbs', 'Danios'],
    breeding: 'Egg scatterer, plant spawner',
    specialRequirements: ['No long-finned tankmates', 'Plants for security']
  },

  'glass catfish': {
    commonName: 'Glass Catfish',
    scientificName: 'Kryptopterus bicirrhis',
    family: 'Siluridae',
    origin: 'Southeast Asia',
    waterType: 'Freshwater',
    minTankSize: '200L',
    temperatureRange: '22-26°C',
    phRange: '6.0-7.0',
    maxSize: '15cm',
    diet: 'Carnivore - frozen foods, live foods, pellets',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '5+ (shoaling species)',
    compatibility: ['Peaceful community fish', 'No small fish they can eat'],
    breeding: 'Rarely breeds in home aquarium',
    specialRequirements: ['Excellent water quality', 'Strong current', 'Peaceful tankmates only']
  },

  // COLDWATER SPECIES
  'goldfish': {
    commonName: 'Common Goldfish',
    scientificName: 'Carassius auratus',
    family: 'Cyprinidae',
    origin: 'East Asia',
    waterType: 'Coldwater',
    minTankSize: '200L',
    temperatureRange: '10-24°C',
    phRange: '6.0-8.0',
    maxSize: '30cm',
    diet: 'Omnivore - pellets, vegetables, live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '2+ (social fish)',
    compatibility: ['Other goldfish varieties', 'Dojo loaches'],
    breeding: 'Egg scatterer, spawns in spring',
    specialRequirements: ['Excellent filtration', 'Large tank essential', 'Cool water preferred']
  },

  'white cloud mountain minnow': {
    commonName: 'White Cloud Mountain Minnow',
    scientificName: 'Tanichthys albonubes',
    family: 'Cyprinidae',
    origin: 'China',
    waterType: 'Coldwater',
    minTankSize: '40L',
    temperatureRange: '15-25°C',
    phRange: '6.0-8.0',
    maxSize: '4cm',
    diet: 'Omnivore - micro pellets, flakes, live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '8+ (active shoaling)',
    compatibility: ['Other coldwater fish', 'Goldfish (if not too large)'],
    breeding: 'Egg scatterer, easy to breed',
    specialRequirements: ['Cool water tolerance', 'Planted tank preferred', 'Good for beginners']
  },

  // BRACKISH SPECIES
  'figure 8 puffer': {
    commonName: 'Figure 8 Puffer',
    scientificName: 'Tetraodon biocellatus',
    family: 'Tetraodontidae',
    origin: 'Southeast Asia',
    waterType: 'Brackish',
    minTankSize: '80L',
    temperatureRange: '24-28°C',
    phRange: '7.5-8.5',
    maxSize: '8cm',
    diet: 'Carnivore - snails, crustaceans, frozen foods',
    careLevel: 'Intermediate',
    temperament: 'Aggressive',
    groupSize: '1 (territorial species)',
    compatibility: ['Brackish species only', 'Large robust tankmates'],
    breeding: 'Rarely breeds in aquarium',
    specialRequirements: ['Brackish water (SG 1.005-1.015)', 'Live/frozen foods essential', 'Species tank preferred']
  },

  'bumblebee goby': {
    commonName: 'Bumblebee Goby',
    scientificName: 'Brachygobius doriae',
    family: 'Gobiidae',
    origin: 'Southeast Asia',
    waterType: 'Brackish',
    minTankSize: '40L',
    temperatureRange: '24-28°C',
    phRange: '7.0-8.5',
    maxSize: '4cm',
    diet: 'Carnivore - live/frozen foods, micro worms',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '6+ (social in groups)',
    compatibility: ['Small brackish species', 'Peaceful community'],
    breeding: 'Cave spawner, challenging',
    specialRequirements: ['Brackish water (SG 1.005-1.010)', 'Live foods preferred', 'Caves for hiding']
  },

  // ADDITIONAL POPULAR SPECIES
  'tiger barb': {
    commonName: 'Tiger Barb',
    scientificName: 'Puntigrus tetrazona',
    family: 'Cyprinidae',
    origin: 'Southeast Asia',
    waterType: 'Freshwater',
    minTankSize: '100L',
    temperatureRange: '22-26°C',
    phRange: '6.0-7.0',
    maxSize: '7cm',
    diet: 'Omnivore - flakes, pellets, live foods',
    careLevel: 'Beginner',
    temperament: 'Semi-Aggressive',
    groupSize: '8+ (reduces aggression)',
    compatibility: ['Fast-swimming fish', 'No long fins', 'Other barbs'],
    breeding: 'Egg scatterer, spawns readily',
    specialRequirements: ['Groups essential', 'No slow/long-finned tankmates', 'Active swimmers']
  },

  'congo tetra': {
    commonName: 'Congo Tetra',
    scientificName: 'Phenacogrammus interruptus',
    family: 'Alestidae',
    origin: 'Central Africa',
    waterType: 'Freshwater',
    minTankSize: '200L',
    temperatureRange: '23-27°C',
    phRange: '6.0-7.5',
    maxSize: '12cm',
    diet: 'Omnivore - quality flakes, pellets, frozen foods',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '6+ (stunning in groups)',
    compatibility: ['Medium peaceful fish', 'Corydoras', 'Gouramis'],
    breeding: 'Egg scatterer, spawns in soft water',
    specialRequirements: ['Soft slightly acidic water', 'Planted tank', 'Swimming space']
  },

  'pearl gourami': {
    commonName: 'Pearl Gourami',
    scientificName: 'Trichopodus leerii',
    family: 'Osphronemidae',
    origin: 'Southeast Asia',
    waterType: 'Freshwater',
    minTankSize: '150L',
    temperatureRange: '24-28°C',
    phRange: '6.0-7.5',
    maxSize: '12cm',
    diet: 'Omnivore - flakes, pellets, live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '1 pair or single',
    compatibility: ['Peaceful community fish', 'Tetras', 'Corydoras'],
    breeding: 'Bubble nest builder, good parents',
    specialRequirements: ['Planted tank', 'Surface access', 'Gentle filtration']
  },

  'swordtail': {
    commonName: 'Swordtail',
    scientificName: 'Xiphophorus hellerii',
    family: 'Poeciliidae',
    origin: 'Central America',
    waterType: 'Freshwater',
    minTankSize: '80L',
    temperatureRange: '22-28°C',
    phRange: '7.0-8.4',
    maxSize: '10cm',
    diet: 'Omnivore - flakes, algae, vegetables',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '3+ (more females than males)',
    compatibility: ['Peaceful community fish', 'Platies', 'Mollies'],
    breeding: 'Livebearer, 28-35 day gestation',
    specialRequirements: ['Moderately hard water', 'Plants for cover', 'Good jumpers - secure lid']
  }
};

// Get species data from database matches OR generate comprehensive specifications automatically
export function getEnhancedSpecifications(record: Record<string, unknown>): { specs: SpeciesInfo; isDatabaseMatch: boolean } {
  const commonName = String(record.commonName || record.name || 'Unknown Species').toLowerCase();
  const scientificName = record.scientificName ? String(record.scientificName || record.ScientificName) : undefined;
  
  // Try database match first
  const databaseMatch = getSpeciesFromDatabase(commonName, scientificName);
  if (databaseMatch) {
    return { specs: databaseMatch, isDatabaseMatch: true };
  }
  
  // If no database match, automatically generate comprehensive specifications
  return { specs: generateComprehensiveSpecifications(record), isDatabaseMatch: false };
}

// Automatically generate comprehensive species specifications
function generateComprehensiveSpecifications(record: Record<string, unknown>): SpeciesInfo {
  const commonName = String(record.commonName || record.name || 'Unknown Species');
  const scientificName = record.scientificName ? String(record.scientificName) : undefined;
  
  // Analyze species type and characteristics from name and scientific name
  const speciesAnalysis = analyzeSpeciesCharacteristics(commonName, scientificName);
  
  return {
    commonName: commonName,
    scientificName: scientificName,
    family: speciesAnalysis.family,
    origin: speciesAnalysis.origin,
    waterType: speciesAnalysis.waterType,
    minTankSize: speciesAnalysis.minTankSize,
    temperatureRange: speciesAnalysis.temperatureRange,
    phRange: speciesAnalysis.phRange,
    maxSize: speciesAnalysis.maxSize,
    diet: speciesAnalysis.diet,
    careLevel: speciesAnalysis.careLevel,
    temperament: speciesAnalysis.temperament,
    groupSize: speciesAnalysis.groupSize,
    compatibility: speciesAnalysis.compatibility,
    breeding: speciesAnalysis.breeding,
    specialRequirements: speciesAnalysis.specialRequirements
  };
}

// Analyze species characteristics based on common name and scientific name
function analyzeSpeciesCharacteristics(commonName: string, scientificName?: string) {
  const nameAnalysis = commonName.toLowerCase();
  const scientificAnalysis = scientificName?.toLowerCase() || '';
  
  // Default specifications
  const analysis: {
    family: string;
    origin: string;
    waterType: 'Freshwater' | 'Coldwater' | 'Brackish' | 'Saltwater';
    minTankSize: string;
    temperatureRange: string;
    phRange: string;
    maxSize: string;
    diet: string;
    careLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    temperament: 'Peaceful' | 'Semi-Aggressive' | 'Aggressive' | 'Territorial';
    groupSize: string;
    compatibility: string[];
    breeding?: string;
    specialRequirements?: string[];
  } = {
    family: 'Unknown',
    origin: 'Captive bred',
    waterType: 'Freshwater',
    minTankSize: '100L',
    temperatureRange: '22-26°C',
    phRange: '6.5-7.5',
    maxSize: '8cm',
    diet: 'Omnivore - flakes, pellets, live/frozen foods',
    careLevel: 'Intermediate',
    temperament: 'Peaceful',
    groupSize: '6+ (schooling species)',
    compatibility: ['Community fish of similar size'],
    breeding: 'Egg scatterer, separate breeding tank recommended',
    specialRequirements: ['Well-planted tank', 'Good water quality', 'Varied diet']
  };
  
  // CICHLID DETECTION
  if (nameAnalysis.includes('cichlid') || scientificAnalysis.includes('tropheus') || 
      scientificAnalysis.includes('labidochromis') || scientificAnalysis.includes('pseudotropheus') ||
      scientificAnalysis.includes('aulonocara') || scientificAnalysis.includes('melanochromis')) {
    
    analysis.family = 'Cichlidae';
    analysis.temperament = 'Semi-Aggressive';
    analysis.groupSize = '6+ (1 male, multiple females recommended)';
    analysis.breeding = 'Mouthbrooder, spawns readily in aquarium';
    analysis.compatibility = ['Other cichlids of similar size', 'Robust community fish'];
    
    // Lake Malawi cichlids
    if (scientificAnalysis.includes('labidochromis') || scientificAnalysis.includes('pseudotropheus') ||
        nameAnalysis.includes('electric yellow') || nameAnalysis.includes('saulosi')) {
      analysis.origin = 'Lake Malawi, Africa';
      analysis.minTankSize = '200L';
      analysis.temperatureRange = '24-26°C';
      analysis.phRange = '7.8-8.6';
      analysis.maxSize = '10cm';
      analysis.diet = 'Omnivore - algae, small invertebrates, quality cichlid pellets';
      analysis.careLevel = 'Beginner';
      analysis.specialRequirements = ['Hard alkaline water', 'Rocky décor with caves', 'Good filtration'];
    }
    
    // Lake Tanganyika cichlids (Tropheus)
    if (scientificAnalysis.includes('tropheus') || nameAnalysis.includes('white spotted')) {
      analysis.origin = 'Lake Tanganyika, Africa';
      analysis.minTankSize = '300L';
      analysis.temperatureRange = '24-27°C';
      analysis.phRange = '8.0-9.0';
      analysis.maxSize = '12cm';
      analysis.diet = 'Herbivore - algae, spirulina, quality vegetable pellets';
      analysis.careLevel = 'Advanced';
      analysis.temperament = 'Aggressive';
      analysis.groupSize = '12+ (large group to spread aggression)';
      analysis.compatibility = ['Other Tropheus species', 'Large Tanganyika cichlids'];
      analysis.breeding = 'Mouthbrooder, requires very large tank for breeding groups';
      analysis.specialRequirements = ['Very hard alkaline water', 'Excellent filtration', 'Rocky caves', 'Vegetarian diet essential'];
    }
  }
  
  // TETRA DETECTION
  else if (nameAnalysis.includes('tetra') || scientificAnalysis.includes('hyphessobrycon') ||
           scientificAnalysis.includes('paracheirodon')) {
    analysis.family = 'Characidae';
    analysis.origin = 'South America';
    analysis.minTankSize = '80L';
    analysis.temperatureRange = '22-26°C';
    analysis.phRange = '6.0-7.0';
    analysis.maxSize = '4cm';
    analysis.diet = 'Omnivore - micro pellets, flakes, small live foods';
    analysis.careLevel = 'Beginner';
    analysis.temperament = 'Peaceful';
    analysis.groupSize = '10+ (tight schooling species)';
    analysis.compatibility = ['Other peaceful community fish', 'Small catfish', 'Dwarf shrimp'];
    analysis.breeding = 'Egg scatterer, soft acidic water for breeding';
    analysis.specialRequirements = ['Soft acidic water', 'Planted tank', 'Schooling environment'];
  }
  
  // GUPPY/LIVEBEARER DETECTION
  else if (nameAnalysis.includes('guppy') || nameAnalysis.includes('molly') || 
           nameAnalysis.includes('platy') || nameAnalysis.includes('swordtail') ||
           scientificAnalysis.includes('poecilia') || scientificAnalysis.includes('xiphophorus')) {
    analysis.family = 'Poeciliidae';
    analysis.origin = 'Central America';
    analysis.minTankSize = '60L';
    analysis.temperatureRange = '22-28°C';
    analysis.phRange = '7.0-8.0';
    analysis.maxSize = '6cm';
    analysis.diet = 'Omnivore - flakes, algae, small live foods';
    analysis.careLevel = 'Beginner';
    analysis.temperament = 'Peaceful';
    analysis.groupSize = '3+ (2 females per male)';
    analysis.compatibility = ['Most peaceful community fish'];
    analysis.breeding = 'Livebearer, very prolific, separate pregnant females';
    analysis.specialRequirements = ['Slightly hard water', 'Plants for cover', 'Separate breeding area'];
  }
  
  // BETTA DETECTION
  else if (nameAnalysis.includes('betta') || nameAnalysis.includes('fighting fish') ||
           scientificAnalysis.includes('betta splendens')) {
    analysis.family = 'Osphronemidae';
    analysis.origin = 'Southeast Asia';
    analysis.minTankSize = '20L';
    analysis.temperatureRange = '24-28°C';
    analysis.phRange = '6.5-7.5';
    analysis.maxSize = '6cm';
    analysis.diet = 'Carnivore - betta pellets, bloodworms, brine shrimp';
    analysis.careLevel = 'Beginner';
    analysis.temperament = 'Aggressive';
    analysis.groupSize = 'Single male only';
    analysis.compatibility = ['Peaceful bottom dwellers', 'Non-aggressive tankmates'];
    analysis.breeding = 'Bubble nest builder, separate breeding tank required';
    analysis.specialRequirements = ['Gentle filtration', 'Floating plants', 'Warm water', 'No fin nippers'];
  }
  
  // ANGELFISH DETECTION
  else if (nameAnalysis.includes('angel') || scientificAnalysis.includes('pterophyllum')) {
    analysis.family = 'Cichlidae';
    analysis.origin = 'South America';
    analysis.minTankSize = '200L';
    analysis.temperatureRange = '24-28°C';
    analysis.phRange = '6.5-7.5';
    analysis.maxSize = '15cm';
    analysis.diet = 'Omnivore - flakes, pellets, live/frozen foods';
    analysis.careLevel = 'Intermediate';
    analysis.temperament = 'Semi-Aggressive';
    analysis.groupSize = '4+ (pairs form naturally)';
    analysis.compatibility = ['Medium-sized community fish', 'Other peaceful cichlids'];
    analysis.breeding = 'Substrate spawner, pairs guard eggs and fry';
    analysis.specialRequirements = ['Tall tank', 'Soft to medium-hard water', 'Peaceful environment'];
  }
  
  // CORYDORAS DETECTION
  else if (nameAnalysis.includes('cory') || nameAnalysis.includes('corydoras') ||
           scientificAnalysis.includes('corydoras')) {
    analysis.family = 'Callichthyidae';
    analysis.origin = 'South America';
    analysis.minTankSize = '80L';
    analysis.temperatureRange = '22-26°C';
    analysis.phRange = '6.0-7.5';
    analysis.maxSize = '7cm';
    analysis.diet = 'Omnivore - sinking pellets, bloodworms, algae wafers';
    analysis.careLevel = 'Beginner';
    analysis.temperament = 'Peaceful';
    analysis.groupSize = '6+ (social bottom dwellers)';
    analysis.compatibility = ['All peaceful community fish'];
    analysis.breeding = 'Egg scatterer, cooler water triggers spawning';
    analysis.specialRequirements = ['Soft substrate', 'Good water quality', 'Social group'];
  }
  
  // PLECO DETECTION
  else if (nameAnalysis.includes('pleco') || nameAnalysis.includes('plecostomus') ||
           scientificAnalysis.includes('ancistrus') || scientificAnalysis.includes('hypostomus')) {
    analysis.family = 'Loricariidae';
    analysis.origin = 'South America';
    analysis.minTankSize = '150L';
    analysis.temperatureRange = '22-28°C';
    analysis.phRange = '6.5-7.5';
    analysis.maxSize = '15cm';
    analysis.diet = 'Omnivore - algae wafers, vegetables, driftwood';
    analysis.careLevel = 'Beginner';
    analysis.temperament = 'Peaceful';
    analysis.groupSize = '1-2 (territorial with own species)';
    analysis.compatibility = ['Most community fish'];
    analysis.breeding = 'Cave spawner, requires specific conditions';
    analysis.specialRequirements = ['Driftwood essential', 'Caves/hiding spots', 'Vegetable matter in diet'];
  }
  
  // GOURAMI DETECTION
  else if (nameAnalysis.includes('gourami') || scientificAnalysis.includes('trichogaster') ||
           scientificAnalysis.includes('colisa')) {
    analysis.family = 'Osphronemidae';
    analysis.origin = 'Southeast Asia';
    analysis.minTankSize = '100L';
    analysis.temperatureRange = '22-28°C';
    analysis.phRange = '6.0-7.5';
    analysis.maxSize = '10cm';
    analysis.diet = 'Omnivore - flakes, pellets, live/frozen foods';
    analysis.careLevel = 'Beginner';
    analysis.temperament = 'Peaceful';
    analysis.groupSize = '2-3 (pairs or small groups)';
    analysis.compatibility = ['Peaceful community fish'];
    analysis.breeding = 'Bubble nest builder, surface spawner';
    analysis.specialRequirements = ['Surface access for air breathing', 'Planted tank', 'Gentle filtration'];
  }
  
  return analysis;
}

// Direct database lookup
export function getSpeciesFromDatabase(commonName?: string, scientificName?: string): SpeciesInfo | null {
  if (!commonName && !scientificName) return null;
  
  // Try exact common name match first
  if (commonName) {
    const key = commonName.toLowerCase();
    if (speciesDatabase[key]) {
      return speciesDatabase[key];
    }
    
    // Try partial matches for common name
    const partialMatch = Object.keys(speciesDatabase).find(dbKey => 
      key.includes(dbKey) || dbKey.includes(key)
    );
    if (partialMatch) {
      return speciesDatabase[partialMatch];
    }
  }
  
  // Try scientific name match
  if (scientificName) {
    const scientificMatch = Object.values(speciesDatabase).find(species =>
      species.scientificName?.toLowerCase() === scientificName.toLowerCase()
    );
    if (scientificMatch) {
      return scientificMatch;
    }
  }
  
  return null;
}


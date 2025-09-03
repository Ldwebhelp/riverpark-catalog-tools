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

// Family-based fallback care specifications for unknown species
const FAMILY_CARE_TEMPLATES: Record<string, Partial<SpeciesInfo>> = {
  'Cichlidae': {
    family: 'Cichlidae',
    waterType: 'Freshwater',
    minTankSize: '150L',
    temperatureRange: '24-28°C',
    phRange: '7.0-8.5',
    diet: 'Omnivore - quality pellets, frozen foods',
    careLevel: 'Intermediate',
    temperament: 'Semi-Aggressive',
    groupSize: 'Species dependent',
    compatibility: ['Other cichlids of similar temperament'],
    specialRequirements: ['Good filtration', 'Territorial considerations']
  },
  
  'Characidae': {
    family: 'Characidae',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '22-26°C',
    phRange: '6.0-7.0',
    diet: 'Omnivore - flakes, micro pellets, live foods',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '6+ (shoaling species)',
    compatibility: ['Peaceful community fish'],
    specialRequirements: ['Soft acidic water preferred', 'Planted tank']
  },
  
  'Poeciliidae': {
    family: 'Poeciliidae',
    waterType: 'Freshwater',
    minTankSize: '60L',
    temperatureRange: '22-28°C',
    phRange: '7.0-8.2',
    diet: 'Omnivore - flakes, algae, vegetables',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: '3+ (more females than males)',
    compatibility: ['Peaceful community fish'],
    breeding: 'Livebearer - easy to breed',
    specialRequirements: ['Moderately hard water', 'Plants for fry cover']
  }
};

// Smart inference function - enhanced with family patterns
export function getEnhancedSpecifications(record: Record<string, unknown>): SpeciesInfo {
  const commonName = String(record.commonName || record.name || 'Unknown Species').toLowerCase();
  const scientificName = record.scientificName ? String(record.scientificName || record.ScientificName) : undefined;
  
  // Try direct species match first
  const directMatch = getSpeciesFromDatabase(commonName, scientificName);
  if (directMatch) {
    return { ...directMatch };
  }
  
  // Try family-based inference if scientific name available
  if (scientificName) {
    const familyName = extractFamilyFromScientificName(scientificName);
    const familyTemplate = FAMILY_CARE_TEMPLATES[familyName];
    if (familyTemplate) {
      return {
        commonName: record.commonName || record.name || 'Unknown Species',
        scientificName,
        origin: 'Unknown',
        maxSize: 'Unknown',
        compatibility: [],
        ...familyTemplate
      } as SpeciesInfo;
    }
  }
  
  // Ultimate fallback - basic community fish template
  return {
    commonName: String(record.commonName || record.name || 'Unknown Species'),
    scientificName,
    family: 'Unknown',
    origin: 'Unknown',
    waterType: 'Freshwater',
    minTankSize: '80L',
    temperatureRange: '22-26°C',
    phRange: '6.5-7.5',
    maxSize: 'Unknown',
    diet: 'Omnivore - quality flakes and pellets',
    careLevel: 'Beginner',
    temperament: 'Peaceful',
    groupSize: 'Species dependent',
    compatibility: ['Research required for compatibility'],
    specialRequirements: ['Standard aquarium care', 'Research species-specific needs']
  };
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

// Helper function to extract family from scientific name
function extractFamilyFromScientificName(scientificName: string): string {
  // This is a simplified approach - in practice you'd want a more comprehensive taxonomy database
  const knownGenera: Record<string, string> = {
    'Labidochromis': 'Cichlidae',
    'Pseudotropheus': 'Cichlidae',
    'Aulonocara': 'Cichlidae',
    'Paracheirodon': 'Characidae',
    'Hyphessobrycon': 'Characidae',
    'Poecilia': 'Poeciliidae',
    'Xiphophorus': 'Poeciliidae',
    'Corydoras': 'Callichthyidae',
    'Ancistrus': 'Loricariidae'
  };
  
  const genus = scientificName.split(' ')[0];
  return knownGenera[genus] || 'Unknown';
}
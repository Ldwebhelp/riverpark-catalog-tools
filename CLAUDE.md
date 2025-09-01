# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Riverpark Catalog Tools** - Professional aquarium business catalog management suite built with Next.js and TypeScript. Standalone application separate from the main Riverpark Catalyst storefront for clean architecture and independent deployment.

## Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3.4.17 (exact version for consistency)
- **Excel Processing**: XLSX.js v0.18.5
- **Deployment**: Vercel
- **Database**: localStorage (development), extensible to production DB

## Project Structure

```
riverpark-catalog-tools/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard homepage
│   │   ├── species/            # Species data generator
│   │   │   └── page.tsx
│   │   ├── guides/             # Care guide generator (planned)
│   │   │   └── page.tsx
│   │   └── api/                # API endpoints
│   │       └── health/
│   ├── components/             # Reusable UI components
│   │   └── SpeciesGenerator.tsx
│   ├── lib/                    # Utilities and business logic
│   │   ├── speciesDatabase.ts  # 50+ species database
│   │   └── database.ts         # Data persistence layer
│   ├── types/                  # TypeScript type definitions
│   │   └── catalog.ts
│   └── app/
│       └── globals.css         # Semantic HTML component styles
├── public/                     # Static assets
└── package.json               # Dependencies and scripts
```

## Development Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint

# Testing
curl http://localhost:3000/api/health  # Test API health endpoint
```

## Key Features

### ✅ Species Data Generator
- **File Processing**: Excel/CSV → JSON with enhanced specifications
- **Database Integration**: 50+ aquarium species with UK measurements
- **Smart Inference**: Family-based fallbacks for unknown species
- **Download Tracking**: Session management with progress indicators
- **Professional Output**: Structured JSON with comprehensive care data

### 📋 Species Database
- **Coverage**: 50+ popular aquarium species (Axolotls, Cichlids, Community Fish)
- **Measurements**: UK standard (Litres, Celsius, Centimetres)
- **Categories**: Freshwater tropical, coldwater, and specialty species
- **Data Quality**: Professional-grade care specifications

### 🎨 UI/UX Design
- **Semantic HTML**: Clean, accessible markup with semantic layout classes
- **Component System**: Reusable UI components with Tailwind CSS
- **Responsive**: Mobile-first design with professional gradients
- **Status Tracking**: Real-time download progress with badges

## Styling Guidelines

### Semantic HTML Components (globals.css)
```css
.semantic-layout     # Main app container with gradient background
.semantic-header     # Professional header with shadow
.semantic-main       # Main content container
.semantic-section    # White card sections
.semantic-card       # Interactive cards with hover effects
.btn-primary         # Blue action buttons
.btn-success         # Green confirmation buttons
.status-badge-*      # Status indicators
```

### Design System
- **Colors**: Blue (primary), Green (success), Gray (neutral)
- **Typography**: Inter font family with system fallbacks
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle shadows for depth without distraction

## Database Architecture

### Development (Current)
- **Storage**: localStorage for client-side persistence
- **Session Management**: UUID-based session tracking
- **Data Types**: Species, Guides, Sessions, Download History
- **Analytics**: Simple counter system

### Production (Extensible)
```typescript
// Easy migration path to production database
// Uncomment Vercel KV or other database connections
// All methods already structured for async database calls
```

## API Endpoints

### Health Check
```
GET /api/health
Response: {
  status: 'healthy',
  service: 'Riverpark Catalog Tools',
  features: { speciesGenerator: true, ... }
}
```

### Future Endpoints (Planned)
```
POST /api/catalog/species     # Save species data
GET  /api/catalog/species     # Retrieve species data
POST /api/catalog/guides      # Save care guides
GET  /api/catalog/guides      # Retrieve care guides
GET  /api/catalog/stats       # System statistics
```

## Species Database Details

### Database Structure
- **File**: `src/lib/speciesDatabase.ts`
- **Format**: TypeScript record with comprehensive species info
- **Coverage**: Popular aquarium species by category

### Species Categories
1. **Axolotls** (4 varieties): Golden, Albino, Leucistic, Wild Type
2. **Cichlids** (2 species): Electric Yellow, Saulosi  
3. **Community Fish** (10+ species): Tetras, Guppies, Angelfish, etc.
4. **Bottom Dwellers** (5+ species): Corydoras, Plecos, Loaches
5. **Specialty Fish** (5+ species): Gouramis, Barbs, Rasboras

### Data Fields
```typescript
interface SpeciesInfo {
  commonName: string;
  scientificName?: string;
  family: string;
  origin: string;
  minTankSize: string;        // UK Litres
  temperatureRange: string;   // Celsius
  phRange: string;
  maxSize: string;           // Centimetres
  diet: string;
  careLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  temperament: 'Peaceful' | 'Semi-Aggressive' | 'Aggressive';
  groupSize: string;
  compatibility: string[];
  specialRequirements?: string[];
}
```

## Development Patterns

### Component Development
- **Client Components**: Use `'use client'` directive for interactive components
- **Server Components**: Default for static content and layouts
- **TypeScript**: Strict typing for all components and data structures
- **Error Handling**: Graceful error handling with user-friendly messages

### State Management
- **React State**: useState/useRef for component-level state
- **File Processing**: Async operations with loading states
- **Download Tracking**: Record-level status management

### File Processing Workflow
1. **Upload**: Accept Excel/CSV files via input
2. **Parse**: XLSX.js conversion to JSON
3. **Enhance**: Species database lookup + inference
4. **Generate**: Create enhanced species records
5. **Download**: Individual or bulk JSON export
6. **Track**: Session and download history

## Business Logic

### Species Enhancement Process
1. **Direct Match**: Try exact common name lookup
2. **Partial Match**: Fuzzy matching on names
3. **Scientific Match**: Match by scientific name
4. **Family Inference**: Use family-based templates
5. **Fallback**: Generic community fish template

### Data Validation
- **Required Fields**: Product ID, Common Name minimum
- **Type Safety**: TypeScript interfaces throughout
- **Error Recovery**: Graceful handling of malformed data
- **Statistics**: Track processing success/failure rates

## Deployment Configuration

### Vercel Setup (Planned)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### Environment Variables
```env
# Production Database (when ready)
DATABASE_URL=
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## Architecture Decisions

### Why Separate Project?
- **Clean Separation**: No coupling with main e-commerce storefront
- **Independent Deployment**: Update tools without affecting sales
- **Team Management**: Different developers can work on different projects  
- **Technology Choice**: Can use different tech stack if needed

### Why Next.js?
- **Familiar Stack**: Consistent with Riverpark Catalyst storefront
- **App Router**: Modern React patterns with server components
- **API Routes**: Built-in API endpoints for backend functionality
- **Vercel Integration**: Seamless deployment and hosting

### Why localStorage for Development?
- **Simple Start**: No database setup required for development
- **Easy Migration**: All database methods async-ready for production
- **Client-Side**: Works without backend during development
- **Extensible**: Clear path to production database

## Future Enhancements

### Planned Features
- **Care Guide Generator**: 7-section comprehensive guides
- **Bulk Operations**: Process multiple files simultaneously  
- **Template System**: Customizable output formats
- **API Integration**: Connect to external aquarium databases
- **User Management**: Multi-user support with authentication

### Technical Improvements
- **Database Migration**: Move to Vercel KV or PostgreSQL
- **Caching**: Add Redis for improved performance
- **File Storage**: Cloud storage for uploaded files
- **Analytics**: Enhanced reporting and statistics
- **Testing**: Comprehensive test suite

## Troubleshooting

### Common Issues
- **File Upload**: Ensure XLSX.js is properly imported
- **TypeScript Errors**: Check type definitions in `/src/types/`
- **Styling Issues**: Verify Tailwind CSS v3.4.17 configuration
- **Local Storage**: Clear browser storage if data issues occur

### Development Server
```bash
# If dev server fails to start
npm install          # Reinstall dependencies
npm run build        # Test build process
rm -rf .next         # Clear Next.js cache
```

## Contributing Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled, no `any` types
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS classes, no inline styles
- **Imports**: Use absolute imports with `@/` alias

### File Naming
- **Pages**: kebab-case (species-generator)
- **Components**: PascalCase (SpeciesGenerator.tsx)
- **Utilities**: camelCase (speciesDatabase.ts)
- **Types**: camelCase with descriptive names

## Integration Notes

### Riverpark Ecosystem
- **Separate**: Independent from main Riverpark Catalyst storefront
- **Data Format**: Compatible JSON structures for potential integration
- **Branding**: Consistent Riverpark Catalyst branding and colors
- **Architecture**: Follows similar patterns to main project

### Professional Use
- **Target Users**: Aquarium business owners, pet store managers
- **Use Cases**: Inventory management, product catalogs, care documentation
- **Data Quality**: UK market focus with professional specifications
- **Output Format**: Industry-standard JSON for system integration

---

**Built for Riverpark Catalyst** - Professional aquarium business catalog management tools.
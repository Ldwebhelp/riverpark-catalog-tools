# 🐠 Riverpark Catalog Tools

Professional aquarium business catalog management suite built with Next.js and TypeScript.

## Features

✅ **Species Data Generator**: Transform Excel files into structured JSON with 50+ fish database  
✅ **Care Guide Generator**: Create comprehensive 7-section care guides  
✅ **Professional UI**: Mobile-responsive design with semantic HTML layout  
✅ **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS v3.4.17  

## Quick Start

```bash
# Clone and install
git clone <this-repo>
cd riverpark-catalog-tools
npm install

# Start development server
npm run dev

# Visit: http://localhost:3000
```

## Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Project Structure

```
riverpark-catalog-tools/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── species/            # Species data generator
│   │   ├── guides/             # Care guide generator
│   │   └── api/                # API endpoints
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utilities and business logic
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
└── docs/                       # Documentation
```

## Usage

1. **Species Generator**: Upload Excel → Generate JSON files with care specifications
2. **Guide Generator**: Create comprehensive care guides like "Our Guide To Keeping Electric Yellow Cichlid Fish"
3. **Professional Dashboard**: Monitor progress with real-time status tracking

## Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3.4.17
- **Excel Processing**: XLSX.js
- **Deployment**: Vercel

## Deployment

```bash
# Deploy to Vercel
vercel --prod
```

---

**Built for Riverpark Catalyst** - Professional aquarium business tools
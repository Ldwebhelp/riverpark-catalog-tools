import Link from 'next/link';
import SpeciesGenerator from '@/components/SpeciesGenerator';

export default function SpeciesPage() {
  return (
    <div className="semantic-layout">
      <header className="semantic-header">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="semantic-nav">
                <Link href="/">Dashboard</Link>
                <span>/</span>
                <span className="text-blue-600">Species Generator</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900">Species Data Generator</h1>
              <p className="text-gray-600 mt-1">Transform Excel data into enhanced species JSON files</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/guides" 
                className="btn-success"
              >
                Care Guides
              </Link>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Riverpark Catalyst
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="semantic-main">
        <SpeciesGenerator />
      </main>
      
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Riverpark Catalyst - Professional Aquarium Business Tools</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
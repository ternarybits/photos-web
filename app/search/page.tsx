'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Photos from 'photos';
import Header from '../components/Header';
import SearchResultsComponent from '../components/SearchResults';
import { ArrowLeft } from 'lucide-react';
import photosClient from '@/lib/photos-client';


function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [assets, setAssets] = useState<Photos.AssetResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setAssets([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setAssets([]); // Clear previous results

      try {
        console.log(`Searching for: ${query}`);
        const searchResults = await photosClient.search.search({ query: query, threshold: 0.75 });
        const fetchedAssets = searchResults.data.map((item: { asset: Photos.AssetResponse }) => item.asset);
        setAssets(fetchedAssets);

        // Store search result order (optional, similar to main page)
        const sortedAssetIds = fetchedAssets.map(asset => asset.id);
        if (typeof window !== 'undefined') {
            localStorage.setItem('currentSearchOrder', JSON.stringify(sortedAssetIds));
        }

      } catch (err) {
        console.error("Error performing search:", err);
        setError(`Failed to search for "${query}".`);
        setAssets([]);
         if (typeof window !== 'undefined') {
            try { localStorage.removeItem('currentSearchOrder'); } catch (e) { console.warn("Failed to remove item from localStorage:", e); }
        }
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]); // Re-run search when query changes

  // Handler for submitting a new search from this page's header
  const handleSearchSubmit = (submittedQuery: string) => {
      const newQuery = submittedQuery.trim();
      if (newQuery && newQuery !== query) {
          // Update the URL query parameter, triggering the useEffect
          router.push(`/search?q=${encodeURIComponent(newQuery)}`);
      }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Use Header component, passing current query and handler */}
      <Header searchQuery={query} onSearchSubmit={handleSearchSubmit} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar area (optional, maybe keep consistent look) */}
        {/* <div className="w-64 border-r border-gray-200 bg-gray-50 p-4"> Nav Placeholder </div> */}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
           {/* Back Button and Title */} 
           <div className="flex justify-between items-center mb-4">
               <div className="flex items-center space-x-2">
                   <button
                       onClick={() => router.back()} // Simple back navigation
                       className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800"
                       aria-label="Go back"
                    >
                       <ArrowLeft size={20} />
                   </button>
                   <h2 className="text-2xl font-semibold text-gray-900">
                       {query ? `Search Results for "${query}"` : 'Search'}
                   </h2>
               </div>
               {/* Optional: Add controls like sort/stack if needed for search results */}
           </div>

           {error && <div className="mb-4 p-2 bg-red-100 text-red-700 text-center text-sm rounded">{error}</div>}

           {/* Use SearchResultsComponent instead of AssetGrid */}
           <SearchResultsComponent
               assets={assets}
               isLoadingAssets={isLoading}
           />
        </main>
      </div>
    </div>
  );
}

// --- Main Page Component (using Suspense for searchParams) ---
export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
} 
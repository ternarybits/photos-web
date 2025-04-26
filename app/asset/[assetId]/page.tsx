// Create new file: app/asset/[assetId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Photos from 'photos'; // Assuming the SDK package is named 'photos'
import Link from 'next/link'; // For back button and potentially nav buttons
import Image from 'next/image';
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// Initialize the Photos SDK client (can potentially share instance later)
const photosClient = new Photos({
  apiKey: 'dummy-api-key', // Provide a placeholder API key
});

// AssetImage component for handling image display with fallback
interface AssetImageProps {
  asset: Photos.AssetResponse;
}

const AssetImage: React.FC<AssetImageProps> = ({ asset }) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = imgError ? null : (asset.thumbnail_url || null);

  return (
    <div className="relative w-full h-full">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Asset ${asset.id}`}
          fill
          priority
          sizes="100vw"
          className="object-contain"
          onError={() => {
            console.error(`Error loading image for asset ${asset.id}:`, asset.thumbnail_url);
            setImgError(true);
          }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <ImageIcon className="w-24 h-24 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default function AssetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const assetId = params.assetId as string; // Get assetId from route

    const [assetDetail, setAssetDetail] = useState<Photos.AssetResponse | null>(null);
    const [previousAssetId, setPreviousAssetId] = useState<string | null>(null);
    const [nextAssetId, setNextAssetId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!assetId) return;

        const fetchAssetDetailAndNav = async () => {
            setIsLoading(true);
            setError(null);
            setAssetDetail(null); // Clear previous asset detail
            setPreviousAssetId(null); // Clear previous/next IDs initially
            setNextAssetId(null);

            try {
                // Fetch the specific asset details
                const detail = await photosClient.assets.retrieve(assetId);
                setAssetDetail(detail as Photos.AssetResponse);

                // --- Read order from localStorage --- 
                if (typeof window !== 'undefined') {
                    try {
                        const storedOrder = localStorage.getItem('currentAssetOrder');
                        if (storedOrder) {
                            const assetIds: string[] = JSON.parse(storedOrder);
                            const currentIndex = assetIds.indexOf(assetId);

                            if (currentIndex !== -1) {
                                // Set previous ID if not the first item
                                if (currentIndex > 0) {
                                    const prevId = assetIds[currentIndex - 1];
                                    setPreviousAssetId(prevId);
                                    router.prefetch(`/asset/${prevId}`); // Prefetch previous page
                                }
                                // Set next ID if not the last item
                                if (currentIndex < assetIds.length - 1) {
                                    const nextId = assetIds[currentIndex + 1];
                                    setNextAssetId(nextId);
                                    router.prefetch(`/asset/${nextId}`); // Prefetch next page
                                }
                            }
                        }
                    } catch (parseError) {
                        console.error("Error reading or parsing asset order from localStorage:", parseError);
                        // Optionally clear the bad data: localStorage.removeItem('currentAssetOrder');
                    }
                }
                 // --- End localStorage logic --- 

            } catch (err) {
                console.error("Error fetching asset details:", err);
                setError(`Failed to load asset details for ID: ${assetId}`);
                setAssetDetail(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssetDetailAndNav();
    }, [assetId]); // Re-run if assetId changes

    // Handlers for navigation buttons - memoized
    const goToPrevious = useCallback(() => {
        if (previousAssetId) {
            router.push(`/asset/${previousAssetId}`);
        }
    }, [previousAssetId, router]);

    const goToNext = useCallback(() => {
        if (nextAssetId) {
            router.push(`/asset/${nextAssetId}`);
        }
    }, [nextAssetId, router]);

    // Effect to handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                goToPrevious();
            } else if (event.key === 'ArrowRight') {
                goToNext();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [goToPrevious, goToNext]); // Depend on the memoized handlers

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4">
            {/* Header with Back Button and Actions */}
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                 <Link href="/" className="text-blue-400 hover:text-blue-300">&larr; Back to Grid</Link>
                 <div className="flex gap-2">
                    <button
                        type="button"
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded cursor-pointer"
                    >Metadata</button>
                    <button
                        type="button"
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded cursor-pointer"
                    >Download</button>
                 </div>
            </header>

            {/* Main Content Area - Make it relative to position buttons */}
            <main className="flex-1 flex justify-center items-center overflow-hidden relative">
                 {/* Loading Indicator */} 
                {isLoading && (
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                )}
                {/* Error Message */} 
                {error && <p className="text-red-400">{error}</p>}
                
                {/* Asset Display Area - Only render if not loading and no error */} 
                {!isLoading && !error && assetDetail && (
                     <> { /* Fragment to group image container and buttons */ }
                         <div className="w-full h-[90vh] relative">
                             <AssetImage asset={assetDetail} />
                         </div>

                        {/* Previous Button */} 
                        {previousAssetId && (
                            <button 
                                type="button"
                                onClick={goToPrevious}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Previous asset"
                                title="Previous asset"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        {/* Next Button */} 
                        {nextAssetId && (
                             <button 
                                type="button"
                                onClick={goToNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Next asset"
                                title="Next asset"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </>
                )}

                 {/* Not Found Message - Only render if not loading, no error, and no detail */} 
                 {!isLoading && !error && !assetDetail && (
                    <p>Asset not found.</p>
                 )}
            </main>
        </div>
    );
}
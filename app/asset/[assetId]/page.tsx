'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Photos from 'photos'; // Assuming the SDK package is named 'photos'
import Link from 'next/link'; // For back button and potentially nav buttons
import Image from 'next/image';
import { ImageIcon, ChevronLeft, ChevronRight, Download, Info, X } from 'lucide-react';

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

// --- Metadata Sidebar Component ---
interface MetadataSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Photos.AssetResponse | null;
}

const MetadataSidebar: React.FC<MetadataSidebarProps> = ({ isOpen, onClose, asset }) => {
    const formatDateTime = (isoString: string | null | undefined) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleString(undefined, {
                dateStyle: 'long', 
                timeStyle: 'short'
            });
        } catch {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            return 'Invalid Date';
        }
    };

    const renderMetadata = () => {
        if (!asset) return <p>No asset data available.</p>;

        const exifData = asset.exif;

        return (
            <div className="space-y-4 text-sm">
                {/* Basic Info - Removed filename and dimensions */}
                <div>
                    <h3 className="font-semibold text-gray-300 mb-1">Details</h3>
                    <p><span className="text-gray-400">Captured:</span> {formatDateTime(asset.local_datetime)}</p>
                    {/* Add other known fields from AssetResponse if needed */}
                </div>

                {/* EXIF Data */}
                {exifData && typeof exifData === 'object' && Object.keys(exifData).length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-300 mb-1">EXIF Data</h3>
                        <ul className="space-y-1 list-disc list-inside text-gray-400">
                            {Object.entries(exifData).map(([key, value]) => {
                                // Skip rendering if the value is null
                                if (value === null) {
                                    return null;
                                }
                                return (
                                    <li key={key} className="truncate" title={`${key}: ${String(value)}`}>
                                        <span className="font-medium text-gray-300">{key}:</span> {String(value)}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {(!exifData || typeof exifData !== 'object' || Object.keys(exifData).length === 0) && (
                    <div>
                         <h3 className="font-semibold text-gray-300 mb-1">EXIF Data</h3>
                         <p className="text-gray-500 italic">No EXIF data available.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className={`fixed top-0 right-0 h-full w-80 bg-gray-800 text-white shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${ 
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
            {/* Sidebar Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-600 h-16 flex-shrink-0">
                <h2 className="text-xl font-semibold">Info</h2>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="p-1 hover:bg-gray-700 rounded-full"
                    aria-label="Close metadata sidebar"
                >
                    <X size={20} />
                </button>
            </div>
            {/* Sidebar Content */}
            <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]"> {/* Adjust height based on header */}
                {renderMetadata()}
            </div>
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Effect to read initial sidebar state from localStorage
    useEffect(() => {
        const storedState = localStorage.getItem('metadataSidebarOpen');
        setIsSidebarOpen(storedState === 'true');
    }, []);

    // Function to toggle sidebar and update localStorage
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => {
            const newState = !prev;
            localStorage.setItem('metadataSidebarOpen', String(newState));
            return newState;
        });
    }, []);

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
                        onClick={toggleSidebar}
                        title="Show metadata"
                    >
                        <Info size={18} />
                    </button>
                    {assetDetail?.download_url && (
                        <a
                            href={assetDetail.download_url}
                            download
                            className="bg-gray-700 hover:bg-gray-600 p-2 rounded cursor-pointer inline-flex items-center justify-center"
                            title="Download asset"
                            aria-label="Download asset"
                        >
                           <Download size={18} />
                        </a>
                    )}
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

            {/* Render the Metadata Sidebar */}
            <MetadataSidebar isOpen={isSidebarOpen} onClose={toggleSidebar} asset={assetDetail} />

        </div>
    );
}
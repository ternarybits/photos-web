// Create new file: app/asset/[assetId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Photos from 'photos'; // Assuming the SDK package is named 'photos'
import Link from 'next/link'; // For back button

// Initialize the Photos SDK client (can potentially share instance later)
const photosClient = new Photos();

// Simple type for Asset Detail - expand as needed
interface AssetDetail extends Asset {
    url?: string; // Example: URL for the full image/video
    // Add other relevant details like metadata, dimensions, type etc.
}

// Simple Asset interface matching HomePage
interface Asset {
    id: string;
}

export default function AssetDetailPage() {
    const params = useParams();
    const assetId = params.assetId as string; // Get assetId from route

    const [assetDetail, setAssetDetail] = useState<AssetDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!assetId) return;

        const fetchAssetDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch the specific asset details
                // Assuming retrieve method exists and returns detailed info
                const detail = await photosClient.assets.retrieve(assetId);
                setAssetDetail(detail as AssetDetail); // Cast to our detail type
            } catch (err) {
                console.error("Error fetching asset details:", err);
                setError(`Failed to load asset details for ID: ${assetId}`);
                setAssetDetail(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssetDetail();
    }, [assetId]); // Re-run if assetId changes

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4">
            {/* Header with Back Button and Actions */}
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                 <Link href="/" className="text-blue-400 hover:text-blue-300">&larr; Back to Grid</Link>
                 {/* TODO: Add metadata and download buttons */}
                 <div className="flex gap-2">
                    <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded">Metadata</button>
                    <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded">Download</button>
                 </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex justify-center items-center overflow-hidden">
                {isLoading && <p>Loading asset...</p>}
                {error && <p className="text-red-400">{error}</p>}
                {!isLoading && !error && assetDetail && (
                    // TODO: Implement proper display based on asset type (image, video, motion photo)
                    <div className="max-w-full max-h-full flex flex-col items-center">
                         {/* Example: Display image if URL exists */}
                        {assetDetail.url ? (
                             <img
                                src={assetDetail.url}
                                alt={`Asset ${assetDetail.id}`}
                                className="max-w-full max-h-full object-contain" // Ensure image fits within bounds
                             />
                        ) : (
                             <p>Asset data exists, but no display URL found. ID: {assetDetail.id}</p>
                        )}
                         {/* Placeholder for video/motion photo controls */}
                    </div>
                )}
                 {!isLoading && !error && !assetDetail && (
                    <p>Asset not found.</p>
                 )}
            </main>
        </div>
    );
}
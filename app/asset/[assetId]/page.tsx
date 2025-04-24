// Create new file: app/asset/[assetId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Photos from 'photos'; // Assuming the SDK package is named 'photos'
import Link from 'next/link'; // For back button
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

// Initialize the Photos SDK client (can potentially share instance later)
const photosClient = new Photos({
  apiKey: 'dummy-api-key', // Provide a placeholder API key
});

// AssetImage component for handling image display with fallback
interface AssetImageProps {
  asset: Photos.AssetResponse;
  className?: string;
}

const AssetImage: React.FC<AssetImageProps> = ({ asset, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = imgError ? null : (asset.thumbnail_url || null);

  return (
    <div className={`relative ${className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Asset ${asset.id}`}
          fill
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
    const assetId = params.assetId as string; // Get assetId from route

    const [assetDetail, setAssetDetail] = useState<Photos.AssetResponse | null>(null);
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
                setAssetDetail(detail as Photos.AssetResponse); // Cast to our detail type
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
                    <div className="w-full h-full flex flex-col items-center">
                         {/* Use the new AssetImage component */}
                         <div className="w-full h-full max-h-[80vh] relative">
                             <AssetImage asset={assetDetail} className="w-full h-full" />
                         </div>
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
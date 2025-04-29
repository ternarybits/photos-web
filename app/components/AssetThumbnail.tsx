'use client';

import React, { useState } from 'react';
import Photos from 'photos';
import Link from 'next/link';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

// --- Component Prop Types ---

export interface AssetThumbnailProps {
    asset: Photos.AssetResponse;
}

// --- Components ---

// Define AssetThumbnail component using Next/Image
const AssetThumbnail: React.FC<AssetThumbnailProps> = ({ asset }) => {
    const [imgError, setImgError] = useState(false);
    // Construct thumbnail URL, handle potential errors or missing URLs
    const thumbnailUrl = imgError || !asset.thumbnail_url ? null : `${asset.thumbnail_url}?size=thumbnail`;

    return (
        <Link href={`/asset/${asset.id}`}>
            <div
                className="bg-gray-200 aspect-square flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:ring-2 ring-blue-500 rounded overflow-hidden relative group" // Added group for potential future styling
                title={`Asset ID: ${asset.id}`}
            >
                {thumbnailUrl ? (
                    <Image
                        src={thumbnailUrl}
                        alt={`Thumbnail for asset ${asset.id}`}
                        fill // Use fill layout
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw" // Optimization
                        className="object-cover transition-transform duration-200 ease-in-out group-hover:scale-105" // Added hover effect
                        onError={() => {
                            console.warn(`Error loading thumbnail for asset ${asset.id}: ${asset.thumbnail_url}`);
                            setImgError(true);
                        }}
                        unoptimized={process.env.NODE_ENV === 'development'} // Avoid optimization issues in dev for external URLs
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                        <ImageIcon className="w-10 h-10 mb-1" />
                        <span className="text-xs">No preview</span>
                    </div>
                )}
            </div>
        </Link>
    );
};

export default AssetThumbnail; 
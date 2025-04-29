'use client';

import React, { useState } from 'react';
import Photos from 'photos';
import Link from 'next/link';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

// --- Component Prop Types ---

interface AssetThumbnailProps {
    asset: Photos.AssetResponse;
}

interface AssetGridProps {
    assets: Photos.AssetResponse[];
    isLoadingAssets: boolean;
    sortBy: 'date' | 'quality';
}

// --- Components ---

// Define AssetThumbnail component using Next/Image
const AssetThumbnail: React.FC<AssetThumbnailProps> = ({ asset }) => {
    const [imgError, setImgError] = useState(false);
    const thumbnailUrl = imgError ? null : (asset.thumbnail_url + "?size=thumbnail" || null);

    return (
        <Link href={`/asset/${asset.id}`}>
            <div
                className="bg-gray-200 aspect-square flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:ring-2 ring-blue-500 rounded overflow-hidden relative" // Added relative for fill layout
                title={`Asset ID: ${asset.id}`}
            >
                {thumbnailUrl ? (
                    <Image
                        src={thumbnailUrl}
                        alt={`Thumbnail for asset ${asset.id}`}
                        fill // Use fill layout
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw" // Optional: Provide sizes for optimization
                        className="object-cover" // Ensure image covers the div
                        onError={() => {
                            console.error(`Error loading image for asset ${asset.id}:`, asset.thumbnail_url);
                            setImgError(true);
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                )}
            </div>
        </Link>
    );
};

// Define AssetGrid component
const AssetGrid: React.FC<AssetGridProps> = ({ assets, isLoadingAssets, sortBy }) => {
    if (isLoadingAssets) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading photos...</p> {/* Replace with spinner later */}
            </div>
        );
    }

    if (assets.length === 0) {
        return <p className="col-span-full text-center text-gray-500 mt-4">No photos found.</p>;
    }

    // Sort assets based on sortBy prop
    const sortedAssets = [...assets].sort((a, b) => {
        if (sortBy === 'date') {
            // Sort by local_datetime in descending order (newest first)
            return new Date(b.local_datetime).getTime() - new Date(a.local_datetime).getTime();
        } else {
            // Sort by quality score in descending order (highest first)
            // Use the first metric value as quality score, or fallback to 0 if no metrics
            const aScore = a.metrics ? Object.values(a.metrics)[0] || 0 : 0;
            const bScore = b.metrics ? Object.values(b.metrics)[0] || 0 : 0;
            return (bScore as number) - (aScore as number);
        }
    });

    // Group assets based on sortBy
    const groupedAssets: { [key: string]: Photos.AssetResponse[] } = {};

    if (sortBy === 'date') {
        // Group by date (YYYY-MM-DD format)
        sortedAssets.forEach(asset => {
            const date = new Date(asset.local_datetime).toISOString().split('T')[0];
            if (!groupedAssets[date]) {
                groupedAssets[date] = [];
            }
            groupedAssets[date].push(asset);
        });
    } else {
        // Group by quality buckets - Single Pass
        const qualityBuckets: { [key: string]: Photos.AssetResponse[] } = {
            'top': [], 'excellent': [], 'good': [], 'okay': [], 'poor': [], 'bad': []
        };

        sortedAssets.forEach(asset => {
            const score = (asset.metrics ? Object.values(asset.metrics)[0] || 0 : 0) as number;
            if (score >= 0.99) {
                qualityBuckets.top.push(asset);
            } else if (score >= 0.8) {
                qualityBuckets.excellent.push(asset);
            } else if (score >= 0.6) {
                qualityBuckets.good.push(asset);
            } else if (score >= 0.4) {
                qualityBuckets.okay.push(asset);
            } else if (score >= 0.2) {
                qualityBuckets.poor.push(asset);
            } else {
                qualityBuckets.bad.push(asset);
            }
        });

        // Only include non-empty buckets
        Object.entries(qualityBuckets).forEach(([bucket, assets]) => {
            if (assets.length > 0) {
                groupedAssets[bucket] = assets;
            }
        });
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format quality bucket name for display
    const formatQualityBucket = (bucket: string) => {
        return bucket.charAt(0).toUpperCase() + bucket.slice(1);
    };

    return (
        <div className="space-y-8">
            {Object.entries(groupedAssets).map(([groupKey, groupAssets]) => (
                <div key={groupKey} className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                        {sortBy === 'date' ? formatDate(groupKey) : formatQualityBucket(groupKey)}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {groupAssets.map((asset: Photos.AssetResponse) => (
                            <AssetThumbnail key={asset.id} asset={asset} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AssetGrid; 
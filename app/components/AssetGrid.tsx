'use client';

import React from 'react';
import Photos from 'photos';
import AssetThumbnail from './AssetThumbnail';

// --- Component Prop Types ---

interface AssetGridProps {
    assets: Photos.AssetResponse[];
    isLoadingAssets: boolean;
    sortBy: 'date' | 'quality';
}

// --- Components ---

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
            // Ensure valid dates before comparison
            const dateA = a.local_datetime ? new Date(a.local_datetime).getTime() : 0;
            const dateB = b.local_datetime ? new Date(b.local_datetime).getTime() : 0;
            return dateB - dateA;
        } else { // sortBy === 'quality'
            const aScore = a.metrics?.quality_score as number | undefined;
            const bScore = b.metrics?.quality_score as number | undefined;

            // Handle undefined scores: assets with scores come before those without
            if (aScore !== undefined && bScore === undefined) {
                return -1; // a comes first
            }
            if (aScore === undefined && bScore !== undefined) {
                return 1;  // b comes first
            }
            if (aScore !== undefined && bScore !== undefined) {
                return bScore - aScore; // Sort by score descending
            }
            // If both are undefined, maintain original relative order (or sort by another criteria if needed)
            // For now, if both are undefined, or if one is undefined and the other is also treated as such (e.g. null),
            // we can compare their local_datetime as a secondary sort criterion.
            const dateA = a.local_datetime ? new Date(a.local_datetime).getTime() : 0;
            const dateB = b.local_datetime ? new Date(b.local_datetime).getTime() : 0;
            return dateB - dateA; // Sort newer undefined ones first among undefined
        }
    });

    // Group assets based on sortBy
    const groupedAssets: { [key: string]: Photos.AssetResponse[] } = {};
    const qualityBucketOrder = ['top', 'excellent', 'good', 'okay', 'poor', 'bad', 'unknown'];

    if (sortBy === 'date') {
        // Group by date (YYYY-MM-DD format)
        sortedAssets.forEach(asset => {
            const date = asset.local_datetime ? new Date(asset.local_datetime).toISOString().split('T')[0] : 'Unknown Date';
            if (!groupedAssets[date]) {
                groupedAssets[date] = [];
            }
            groupedAssets[date].push(asset);
        });
    } else { // sortBy === 'quality'
        // Initialize quality buckets including 'unknown'
        const qualityBuckets: { [key: string]: Photos.AssetResponse[] } = {
            'top': [], 'excellent': [], 'good': [], 'okay': [], 'poor': [], 'bad': [], 'unknown': []
        };

        sortedAssets.forEach(asset => {
            const score = asset.metrics?.quality_score as number | undefined;

            if (score === undefined) {
                qualityBuckets.unknown.push(asset);
            } else if (score >= 0.99) {
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
                qualityBuckets.bad.push(asset); // Scores below 0.2
            }
        });

        // Add buckets to groupedAssets in the predefined order, only if they have assets
        qualityBucketOrder.forEach(bucketName => {
            if (qualityBuckets[bucketName] && qualityBuckets[bucketName].length > 0) {
                groupedAssets[bucketName] = qualityBuckets[bucketName];
            }
        });
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        if (dateString === 'Unknown Date') {
            return 'Unknown Date';
        }
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
        if (bucket === 'unknown') return 'Unknown Quality';
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
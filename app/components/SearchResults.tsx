'use client';

import React from 'react';
import Photos from 'photos';
import AssetThumbnail from './AssetThumbnail';

interface SearchResultsProps {
    assets: Photos.AssetResponse[];
    isLoadingAssets: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ assets, isLoadingAssets }) => {
    if (isLoadingAssets) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading search results...</p>
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">No results found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {assets.map((asset) => (
                <AssetThumbnail key={asset.id} asset={asset} />
            ))}
        </div>
    );
};

export default SearchResults; 
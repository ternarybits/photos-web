'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import Photos from 'photos'; // Import Photos SDK type
import { X } from 'lucide-react'; // Import X icon for sidebar

// --- Context Definition ---
interface MetadataSidebarContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    assetForSidebar: Photos.AssetResponse | null; // Add asset state
    setAssetForSidebar: (asset: Photos.AssetResponse | null) => void; // Add setter
}

const MetadataSidebarContext = createContext<MetadataSidebarContextType | undefined>(undefined);

// Custom hook for using the context
export function useMetadataSidebar() {
    const context = useContext(MetadataSidebarContext);
    if (context === undefined) {
        throw new Error('useMetadataSidebar must be used within a MetadataSidebarProvider');
    }
    return context;
}

// --- Metadata Sidebar Component (Moved from page.tsx) ---
interface MetadataSidebarProps {
    onClose: () => void;
    asset: Photos.AssetResponse | null;
}

const MetadataSidebar: React.FC<MetadataSidebarProps> = ({ onClose, asset }) => {
    // Format DateTime function (keep as is)
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

    // Render Metadata function (keep as is, using asset.exif)
    const renderMetadata = () => {
        // If asset is null (loading or not found), render nothing
        if (!asset) return null;

        const exifData = asset.exif;
        return (
            <div className="space-y-4 text-sm">
                {/* Basic Info */}
                <div>
                    <h3 className="font-semibold text-gray-300 mb-1">Details</h3>
                    <p><span className="text-gray-400">Captured:</span> {formatDateTime(asset.local_datetime)}</p>
                </div>
                {/* EXIF Data */}
                {exifData && typeof exifData === 'object' && Object.keys(exifData).length > 0 && (
                     <div>
                        <h3 className="font-semibold text-gray-300 mb-1">EXIF Data</h3>
                        <ul className="space-y-1 list-disc list-inside text-gray-400">
                            {Object.entries(exifData).map(([key, value]) => {
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

    // Sidebar structure - remove positioning/transform, use props from layout
    return (
        <div className="w-80 h-full bg-gray-800 text-white flex flex-col flex-shrink-0 border-l border-gray-600">
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
            <div className="p-4 overflow-y-auto flex-grow">
                {renderMetadata()}
            </div>
        </div>
    );
};

// --- Layout Component ---
export default function AssetLayout({ children }: { children: ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [assetForSidebar, setAssetForSidebar] = useState<Photos.AssetResponse | null>(null);

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

    const contextValue = { isSidebarOpen, toggleSidebar, assetForSidebar, setAssetForSidebar };

    return (
        <MetadataSidebarContext.Provider value={contextValue}>
            <div className="flex h-screen bg-gray-900"> {/* Apply base bg here */}
                {/* Content Area - occupies remaining space */}
                <div className="flex-grow h-full overflow-hidden">
                    {children}
                </div>
                {/* Sidebar Area - Renders conditionally */}
                {isSidebarOpen && (
                    <MetadataSidebar
                        onClose={toggleSidebar} // Pass toggle function as onClose
                        asset={assetForSidebar} // Pass asset from context state
                    />
                )}
            </div>
        </MetadataSidebarContext.Provider>
    );
} 
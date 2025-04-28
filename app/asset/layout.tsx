'use client';

import React, { ReactNode } from 'react'; // Removed unused imports
// import Photos from 'photos'; // Removed unused import
import { X } from 'lucide-react'; // Import X icon for sidebar
import { MetadataSidebarProvider, useMetadataSidebar } from './context'; // Import provider and hook

// --- Metadata Sidebar Component ---
// Removed empty interface MetadataSidebarProps

const MetadataSidebar: React.FC = () => { // Use React.FC without props
    const { isSidebarOpen, toggleSidebar, assetForSidebar } = useMetadataSidebar(); // Use context

    // Format DateTime function (keep as is)
    const formatDateTime = (isoString: string | null | undefined) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleString(undefined, {
                dateStyle: 'long',
                timeStyle: 'short'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    // Render Metadata function (uses assetForSidebar from context)
    const renderMetadata = () => {
        if (!assetForSidebar) return null;

        const exifData = assetForSidebar.exif;
        return (
            <div className="space-y-4 text-sm">
                {/* Basic Info */}
                <div>
                    <h3 className="font-semibold text-gray-300 mb-1">Details</h3>
                    <p><span className="text-gray-400">Captured:</span> {formatDateTime(assetForSidebar.local_datetime)}</p>
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

    // Don't render if sidebar isn't open
    if (!isSidebarOpen) return null;

    // Sidebar structure
    return (
        <div className="w-80 h-full bg-gray-800 text-white flex flex-col flex-shrink-0 border-l border-gray-600">
            {/* Sidebar Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-600 h-16 flex-shrink-0">
                <h2 className="text-xl font-semibold">Info</h2>
                <button
                    type="button"
                    onClick={toggleSidebar} // Use toggleSidebar from context
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
    return (
        <MetadataSidebarProvider> {/* Wrap layout content with the provider */}
            <div className="flex h-screen bg-gray-900">
                {/* Content Area */}
                <div className="flex-grow h-full overflow-hidden">
                    {children}
                </div>
                {/* Sidebar Area - Renders conditionally inside the component */}
                <MetadataSidebar /> {/* No props needed, it uses context */} 
            </div>
        </MetadataSidebarProvider>
    );
} 
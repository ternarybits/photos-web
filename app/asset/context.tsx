'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import Photos from 'photos'; // Import Photos SDK type

// --- Context Definition ---
interface MetadataSidebarContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    assetForSidebar: Photos.AssetResponse | null;
    setAssetForSidebar: (asset: Photos.AssetResponse | null) => void;
}

export const MetadataSidebarContext = createContext<MetadataSidebarContextType | undefined>(undefined);

// Custom hook for using the context
export function useMetadataSidebar() {
    const context = useContext(MetadataSidebarContext);
    if (context === undefined) {
        throw new Error('useMetadataSidebar must be used within a MetadataSidebarProvider');
    }
    return context;
}

// --- Context Provider ---
interface MetadataSidebarProviderProps {
    children: ReactNode;
}

export function MetadataSidebarProvider({ children }: MetadataSidebarProviderProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [assetForSidebar, setAssetForSidebar] = useState<Photos.AssetResponse | null>(null);

    // Effect to read initial sidebar state from localStorage
    useEffect(() => {
        const storedState = localStorage.getItem('metadataSidebarOpen');
        // Ensure this runs only on the client
        if (typeof window !== 'undefined') {
            setIsSidebarOpen(storedState === 'true');
        }
    }, []);

    // Function to toggle sidebar and update localStorage
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => {
            const newState = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('metadataSidebarOpen', String(newState));
            }
            return newState;
        });
    }, []);

    const contextValue = { isSidebarOpen, toggleSidebar, assetForSidebar, setAssetForSidebar };

    return (
        <MetadataSidebarContext.Provider value={contextValue}>
            {children}
        </MetadataSidebarContext.Provider>
    );
} 
'use client';

import React, { ReactNode, useState, useEffect } from 'react'; 
import type { Photos } from "photos";
import { X } from 'lucide-react';
import { MetadataSidebarProvider, useMetadataSidebar } from './context';
import { listPeopleAction, listFacesAction } from '../actions';
import PersonThumbnail from '../components/PersonThumbnail';
import FaceThumbnail from '../components/FaceThumbnail';

// --- Metadata Sidebar Component ---

const MetadataSidebar: React.FC = () => {
    const { isSidebarOpen, toggleSidebar, assetForSidebar } = useMetadataSidebar(); // Use context
    const [peopleInAsset, setPeopleInAsset] = useState<Photos.PersonResponse[] | null>(null);
    const [peopleMap, setPeopleMap] = useState<Map<string, Photos.PersonResponse>>(new Map());
    const [isLoadingPeople, setIsLoadingPeople] = useState(false);
    const [peopleError, setPeopleError] = useState<string | null>(null);

    const [facesInAsset, setFacesInAsset] = useState<Photos.FaceResponse[] | null>(null);
    const [isLoadingFaces, setIsLoadingFaces] = useState(false);
    const [facesError, setFacesError] = useState<string | null>(null);

    // Effect to fetch people when the asset changes
    useEffect(() => {
        if (assetForSidebar?.id) {
            const fetchPeople = async () => {
                setIsLoadingPeople(true);
                setPeopleError(null);
                setPeopleInAsset(null);
                setPeopleMap(new Map());
                try {
                    const people = await listPeopleAction({ asset_id: assetForSidebar.id });
                    setPeopleInAsset(people);
                    const newMap = new Map(people.map(p => [p.id, p]));
                    setPeopleMap(newMap);
                } catch (error) {
                    console.error("Failed to fetch people for asset:", error);
                    setPeopleError("Could not load people.");
                } finally {
                    setIsLoadingPeople(false);
                }
            };
            fetchPeople();
        } else {
            // Clear people if no asset is selected
            setPeopleInAsset(null);
            setPeopleMap(new Map());
            setIsLoadingPeople(false);
            setPeopleError(null);
        }
    }, [assetForSidebar?.id]); // Depend on asset ID

    // Effect to fetch faces when the asset changes
    useEffect(() => {
        // Create an AbortController to cancel the fetch if the asset changes again
        const abortController = new AbortController();
        const signal = abortController.signal;

        if (assetForSidebar?.id) {
            const fetchFaces = async () => {
                setIsLoadingFaces(true);
                setFacesError(null);
                setFacesInAsset(null);
                try {
                    // Pass the signal to the action if it supports it.
                    // For now, we're focusing on the React component's logic.
                    // The action would need to be modified to accept and use the signal.
                    const faces = await listFacesAction({ asset_id: assetForSidebar.id }); // Removed signal argument
                    // Check if the request was aborted before updating state
                    if (!signal.aborted) {
                        setFacesInAsset(faces);
                    }
                } catch (error: unknown) { // Changed from any to unknown
                    if (error instanceof Error && error.name === 'AbortError') {
                        console.log('Faces fetch aborted');
                    } else {
                        console.error("Failed to fetch faces for asset:", error);
                        if (!signal.aborted) {
                            setFacesError("Could not load faces.");
                        }
                    }
                } finally {
                    if (!signal.aborted) {
                        setIsLoadingFaces(false);
                    }
                }
            };
            fetchFaces();
        } else {
            setFacesInAsset(null);
            setIsLoadingFaces(false);
            setFacesError(null);
        }

        // Cleanup function to abort the fetch if the component unmounts or the dependency changes
        return () => {
            abortController.abort();
        };
    }, [assetForSidebar?.id]);

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

                {/* People Section */}
                <div>
                    <h3 className="font-semibold text-gray-300 mb-1">People</h3>
                    {isLoadingPeople && <p className="text-gray-500 italic">Loading people...</p>}
                    {peopleError && <p className="text-red-400 italic">{peopleError}</p>}
                    {!isLoadingPeople && !peopleError && (
                        peopleInAsset === null || peopleInAsset.length === 0 ? (
                            <p className="text-gray-500 italic">No people identified in this asset.</p>
                        ) : (
                            <ul className="space-y-2">
                                {peopleInAsset.map((person) => (
                                    <PersonThumbnail key={person.id} person={person} />
                                ))}
                            </ul>
                        )
                    )}
                </div>

                {/* Faces Section */}
                <div>
                    <h3 className="font-semibold text-gray-300 mb-2">Faces in this Asset</h3>
                    {isLoadingFaces && <p className="text-gray-500 italic">Loading faces...</p>}
                    {facesError && <p className="text-red-400 italic">{facesError}</p>}
                    {!isLoadingFaces && !facesError && (
                        facesInAsset === null || facesInAsset.length === 0 ? (
                            <p className="text-gray-500 italic">No faces identified in this asset.</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {facesInAsset.map((face) => (
                                    <FaceThumbnail key={face.id} face={face} showPersonName={true} peopleMap={peopleMap} />
                                ))}
                            </div>
                        )
                    )}
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
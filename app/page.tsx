'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Photos from 'photos';
import UploadModal from './components/UploadModal';
import LeftNav from './components/LeftNav';
import AssetGrid from './components/AssetGrid';
import Header from './components/Header';
import { Trash2, Upload, Layers } from 'lucide-react';

// Initialize the Photos SDK client
// Note: Authentication details might be needed later.
// Add a dummy apiKey to satisfy the SDK's requirement
const photosClient = new Photos({
  apiKey: 'dummy-api-key', // Provide a placeholder API key
});

// --- Components ---

function PhotosApp() {
  // Navigation hooks
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use defined types for state
  const [albums, setAlbums] = useState<Photos.AlbumResponse[]>([]);
  const [assets, setAssets] = useState<Photos.AssetResponse[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize sortBy state to null initially, will be set by useEffect
  const [sortBy, setSortBy] = useState<'date' | 'quality' | null>(null);
  const [stackSimilar, setStackSimilar] = useState(false);

  // Add state for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Function to fetch albums (can be reused)
  const fetchAlbums = useCallback(async (showLoading = true) => {
      if (showLoading) setLoadingAlbums(true);
      // Clear only album-related errors
      if (error === "Failed to load albums." || error?.startsWith("Failed to create album")) setError(null);
      try {
        const fetchedAlbums: Photos.AlbumResponse[] = [];
        for await (const album of photosClient.albums.list()) {
           fetchedAlbums.push(album as Photos.AlbumResponse);
        }
        fetchedAlbums.sort((a, b) => a.name.localeCompare(b.name));
        setAlbums(fetchedAlbums);
      } catch (err) {
        console.error("Error fetching albums:", err);
        setError("Failed to load albums.");
        setAlbums([]); // Clear albums on fetch error
      } finally {
        if (showLoading) setLoadingAlbums(false);
      }
    }, [error]);

  // Fetch albums on mount
  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Effect to set initial state from URL query parameters
  useEffect(() => {
    const initialAlbumId = searchParams.get('album');
    const initialSortBy = searchParams.get('sort') as 'date' | 'quality' | null;
    const initialStack = searchParams.get('stack') === 'true';

    // Update album ID if different from URL
    if (initialAlbumId !== selectedAlbumId) {
        setSelectedAlbumId(initialAlbumId);
    }

    // Update sort order if different from URL, defaulting to 'date'
    const validSort = initialSortBy === 'quality' ? 'quality' : 'date';
    if (validSort !== sortBy) {
        setSortBy(validSort);
    }
    
    // Update stack state if different from URL
    if (initialStack !== stackSimilar) {
        setStackSimilar(initialStack);
    }

  }, [searchParams, selectedAlbumId, sortBy, stackSimilar]);

  // Fetch assets based on state (removed search logic)
  useEffect(() => {
    const fetchAssets = async () => {
        // Clear only asset-related errors
        if (error?.startsWith("Failed to load assets")) setError(null);
        setLoadingAssets(true);
        let fetchedAssets: Photos.AssetResponse[] = [];
        try {
            // --- Fetch Regular Asset List --- (Removed search logic)
            const listParams = selectedAlbumId ? { album_id: selectedAlbumId } : {};
            const assetsList: Photos.AssetResponse[] = [];
            for await (const asset of photosClient.assets.list(listParams)) {
                assetsList.push(asset);
            }
            
            // Sort based on current sortBy state
            fetchedAssets = [...assetsList].sort((a, b) => {
                 if (sortBy === 'date') {
                     // Ensure valid dates before comparison
                    const dateA = a.local_datetime ? new Date(a.local_datetime).getTime() : 0;
                    const dateB = b.local_datetime ? new Date(b.local_datetime).getTime() : 0;
                    return dateB - dateA;
                 } else if (sortBy === 'quality') {
                    // Use ?. and provide default 0 for potentially missing metrics
                    const aScore = a.metrics ? Object.values(a.metrics)[0] ?? 0 : 0;
                    const bScore = b.metrics ? Object.values(b.metrics)[0] ?? 0 : 0;
                    return (bScore as number) - (aScore as number);
                 } else {
                    return 0; // Should not happen if sortBy is initialized
                 }
            });
            
            // Apply stacking logic if enabled (Placeholder: Actual stacking needs implementation)
            if (stackSimilar) {
                // TODO: Implement logic to group similar assets
                console.log("Stacking is enabled - Apply grouping logic here.");
            }

            // Store regular list order
            const sortedAssetIds = fetchedAssets.map(asset => asset.id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('currentAssetOrder', JSON.stringify(sortedAssetIds));
            }
            setAssets(fetchedAssets);
        } catch (err) {
            console.error("Error fetching assets:", err);
            const errorMsg = `Failed to load assets.${selectedAlbumId ? ` Album ID: ${selectedAlbumId}` : ''}`;
            setError(errorMsg);
            setAssets([]);
            if (typeof window !== 'undefined') {
                try { localStorage.removeItem('currentAssetOrder'); } catch (e) { console.warn("Failed to remove item from localStorage:", e); }
            }
        } finally {
            setLoadingAssets(false);
        }
    };

    if (!loadingAlbums && sortBy) { // Ensure albums and sortBy are loaded
        fetchAssets();
    }
  }, [selectedAlbumId, loadingAlbums, sortBy, error, stackSimilar]);

  // Helper function to update URL with current parameters
  const updateUrlParams = useCallback((albumId: string | null, currentSortBy: 'date' | 'quality', currentStack: boolean) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      if (!albumId) {
          current.delete('album');
      } else {
          current.set('album', albumId);
      }

      // Always set the sort parameter
      current.set('sort', currentSortBy);

      // Set stack parameter only if true
      if (currentStack) {
        current.set('stack', 'true');
      } else {
        current.delete('stack');
      }

      const search = current.toString();
      const query = search ? `?${search}` : "";
      // Use replace to avoid polluting browser history for param changes
      router.replace(`${pathname}${query}`);
  }, [pathname, router, searchParams]);

  // --- Search Handler ---
  const handleSearchSubmit = (submittedQuery: string) => {
      const newQuery = submittedQuery.trim();
      if (newQuery) {
          // Navigate to the search page instead of updating state
          router.push(`/search?q=${encodeURIComponent(newQuery)}`);
      }
  };

  // Handler for the "New Album" button click
  const handleNewAlbumClick = async () => {
      // Use a default name instead of prompting
      const newAlbumName = "Untitled Album";

      // Optional: Add some loading indicator state here
      setError(null); // Clear previous errors
      try {
          console.log(`Creating album: ${newAlbumName}`);
          // Create album with the default name
          const newAlbum = await photosClient.albums.create({ name: newAlbumName });
          console.log("Album created:", newAlbum);

          // Re-fetch the list and select the new album
          await fetchAlbums(false);
          setSelectedAlbumId(newAlbum.id);
          // Ensure sortBy has a value before updating URL
          if (sortBy) {
            updateUrlParams(newAlbum.id, sortBy, stackSimilar);
          }

      } catch (err) {
          console.error("Error creating album:", err);
          setError(`Failed to create album "${newAlbumName}".`);
          // Handle specific API errors if needed
      } finally {
          // Optional: Reset loading indicator state here
    }
  };

  // Determine title based on album selection (removed search logic)
  const selectedAlbum = albums.find(album => album.id === selectedAlbumId);
  let mainTitle = "All Photos";
  if (selectedAlbum) {
      mainTitle = selectedAlbum.name;
  }

  // Handler for uploading files
  const handleUpload = async (files: FileList) => {
    setError(null); // Clear any previous errors
    setUploadProgress(0); // Start progress at 0
    try {
      const totalFiles = files.length;
      // Upload each file
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // Update progress before starting the upload for this file
        setUploadProgress(((i) / totalFiles) * 100);

        // Create asset params object
        const assetParams: Photos.AssetCreateParams = {
          asset_data: file,
          device_asset_id: `web-upload-${Date.now()}-${i}`, // Generate a unique ID
          device_id: 'web-client',
          file_created_at: new Date(file.lastModified).toISOString(),
          file_modified_at: new Date(file.lastModified).toISOString()
        };

        // Upload the asset using the SDK
        const asset = await photosClient.assets.create(assetParams);

        // If we're in an album, add the asset to it
        if (selectedAlbumId) {
          await photosClient.albums.assets.add(selectedAlbumId, {
            asset_ids: [asset.id]
          });
        }
        
        // Update progress after successful upload and potential album add
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      // Refresh the assets list
      const fetchedAssets: Photos.AssetResponse[] = [];
      const listParams = selectedAlbumId ? { album_id: selectedAlbumId } : {};
      for await (const asset of photosClient.assets.list(listParams)) {
        fetchedAssets.push(asset);
      }
      // Apply sorting after fetching new assets
      fetchedAssets.sort((a, b) => {
           if (sortBy === 'date') {
               const dateA = a.local_datetime ? new Date(a.local_datetime).getTime() : 0;
               const dateB = b.local_datetime ? new Date(b.local_datetime).getTime() : 0;
               return dateB - dateA;
           } else if (sortBy === 'quality') {
               const aScore = a.metrics ? Object.values(a.metrics)[0] ?? 0 : 0;
               const bScore = b.metrics ? Object.values(b.metrics)[0] ?? 0 : 0;
               return (bScore as number) - (aScore as number);
           } else {
               return 0; // Default case
           }
       });
      setAssets(fetchedAssets);
       // Store updated list order
       const sortedAssetIds = fetchedAssets.map(asset => asset.id);
       if (typeof window !== 'undefined') {
           localStorage.setItem('currentAssetOrder', JSON.stringify(sortedAssetIds));
       }

    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload one or more files.');
      throw err; // Re-throw to be caught by the modal's error handling
    } finally {
       setUploadProgress(null); // Reset progress on completion or error
    }
  };

  // Handlers for sort and stack changes
  const handleSortChange = (newSortBy: 'date' | 'quality') => {
    if (newSortBy !== sortBy) {
      setSortBy(newSortBy);
      updateUrlParams(selectedAlbumId, newSortBy, stackSimilar); // Update URL with new sort
      console.log("Sort changed to:", newSortBy);
    }
  };

  const handleStackToggle = () => {
    const newStackState = !stackSimilar;
    setStackSimilar(newStackState);
    updateUrlParams(selectedAlbumId, sortBy ?? 'date', newStackState); // Update URL with new stack state
    // TODO: Apply/remove stacking logic locally based on the new `stackSimilar` state.
    // This logic should ideally happen where `displayedAssets` is determined.
    console.log("Stack similar toggled to:", newStackState);
  };

  // Function to update an album's name via SDK and refresh state
  const updateAlbumName = async (albumId: string, newName: string) => {
      // Basic validation
      if (!newName || !newName.trim()) {
          alert("Album name cannot be empty.");
          return false; // Indicate failure
      }

      // Prevent unnecessary API call if name hasn't changed (optional)
      const currentAlbum = albums.find(a => a.id === albumId);
      if (currentAlbum && currentAlbum.name === newName.trim()) {
          return true; // Indicate success (no change needed)
      }

      setError(null); // Clear previous errors
      try {
          console.log(`Updating album ${albumId} to name: ${newName.trim()}`);
          await photosClient.albums.update(albumId, { name: newName.trim() });
          console.log(`Album ${albumId} updated.`);
          // Refresh the album list to show the change
          await fetchAlbums(false); // Re-fetch without showing main loading spinner
          return true; // Indicate success
      } catch (err) {
          console.error(`Error updating album ${albumId}:`, err);
          setError(`Failed to update album name for ID: ${albumId}.`);
          return false; // Indicate failure
      }
  };

  // Handler to delete an album
  const handleDeleteAlbum = async (albumId: string) => {
      if (!albumId) return;

      const albumToDelete = albums.find(a => a.id === albumId);
      if (!albumToDelete) {
          setError("Could not find album to delete.");
          return;
      }

      // Confirmation dialog
      if (!window.confirm(`Are you sure you want to delete the album "${albumToDelete.name}"? This cannot be undone.`)) {
          return;
      }

      setError(null);
      // Consider adding a specific loading state for deletion if needed
      try {
          console.log(`Deleting album: ${albumId}`);
          await photosClient.albums.delete(albumId);
          console.log(`Album ${albumId} deleted.`);
          // Refresh albums list
          await fetchAlbums(false);

          // Navigate back to All Photos if the deleted one was selected
          if (selectedAlbumId === albumId) {
              setSelectedAlbumId(null);
               // Explicitly update URL immediately
               updateUrlParams(null, sortBy ?? 'date', stackSimilar);
          }

      } catch (err) {
          console.error(`Error deleting album ${albumId}:`, err);
          setError(`Failed to delete album "${albumToDelete.name}".`);
          // Optionally re-fetch albums to ensure consistency even on error
          // await fetchAlbums(false);
      }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
       <Header
           onSearchSubmit={handleSearchSubmit}
       />
       {error && <div className="p-2 bg-red-100 text-red-700 text-center text-sm flex-shrink-0">{error}</div>}
       <div className="flex flex-1 overflow-hidden">
        <LeftNav
           albums={albums}
           selectedAlbumId={selectedAlbumId}
           isLoadingAlbums={loadingAlbums}
           onNewAlbumClick={handleNewAlbumClick}
        />
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
           {sortBy && (
               <> {/* Fragment to group title/controls and grid */} 
                    {/* Title Area */}
                    <div className="mb-4">
                        {selectedAlbumId && selectedAlbum ? (
                            <EditableAlbumTitle
                                initialName={selectedAlbum.name}
                                albumId={selectedAlbumId}
                                onSave={updateAlbumName}
                             />
                         ) : (
                             <h2 className="text-2xl font-semibold text-gray-900 flex-shrink-0">{mainTitle}</h2>
                         )}
                    </div>
 
                    {/* Action Buttons Row */}
                    <div className="flex justify-between items-center mb-4">
                        {/* Left-aligned controls (Sort, Stack) */}
                        <div className="flex space-x-2">
                            {/* Sort Toggle Button Group */}
                            <div className="inline-flex items-center rounded-md border border-input bg-transparent" role="group">
                                <button
                                    type="button"
                                    onClick={() => handleSortChange('date')}
                                    disabled={sortBy === 'date'}
                                    className={`cursor-pointer inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 rounded-l-md ${sortBy === 'date' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                                >
                                    Date
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSortChange('quality')}
                                    disabled={sortBy === 'quality'}
                                    className={`cursor-pointer inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 rounded-r-md border-l border-input ${sortBy === 'quality' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                                >
                                    Quality
                                </button>
                            </div>
                            <button
                                onClick={handleStackToggle}
                                aria-pressed={stackSimilar}
                                className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${stackSimilar ? 'border border-input bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'}`}
                            >
                                <Layers className="mr-2 h-4 w-4" /> {stackSimilar ? 'Unstack' : 'Stack Similar'}
                            </button>
                        </div>

                        {/* Right-aligned controls (Add, Delete) */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                            >
                                <Upload className="mr-2 h-4 w-4" /> Add Photos
                            </button>
                            {selectedAlbumId && (
                                <button
                                    onClick={() => handleDeleteAlbum(selectedAlbumId)}
                                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Album
                                </button>
                            )}
                        </div>
                    </div>
 
                    <AssetGrid
                        assets={assets}
                        isLoadingAssets={loadingAssets}
                        sortBy={sortBy}
                    />
               </>
           )}
           {/* Handle case where sortBy isn't set yet (initial load) */} 
           {!sortBy && !loadingAlbums && (
                <div className="flex justify-center items-center h-64">
                   <p className="text-gray-500">Loading view options...</p>
                </div>
           )}
        </main>
      </div>
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        albumName={selectedAlbum?.name}
        uploadProgress={uploadProgress ?? undefined}
      />
    </div>
  );
}

// --- Editable Title Component --- (New Component)
interface EditableAlbumTitleProps {
    initialName: string;
    albumId: string;
    onSave: (albumId: string, newName: string) => Promise<boolean>;
}

function EditableAlbumTitle({ initialName, albumId, onSave }: EditableAlbumTitleProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Update local name if initialName changes (e.g., album refetched)
    useEffect(() => {
        setName(initialName);
    }, [initialName]);

    const handleEditClick = () => {
        setIsEditing(true);
        // Focus the input after a short delay to allow rendering
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleBlur = async () => {
        // Only save if the name actually changed
        if (name.trim() !== initialName && name.trim() !== '') {
            setIsSaving(true);
            const success = await onSave(albumId, name.trim());
            if (!success) {
                 // Revert name if save failed (optional: show error message)
                setName(initialName);
                 alert("Failed to save album name.");
            }
            setIsSaving(false);
        } else {
             // Revert to original name if it's empty or unchanged
             setName(initialName);
        }
         setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
         if (e.key === 'Enter') {
             inputRef.current?.blur(); // Trigger blur to save
         } else if (e.key === 'Escape') {
            setName(initialName); // Revert on escape
            setIsEditing(false);
            inputRef.current?.blur();
         }
    };

    if (isEditing) {
        return (
             <input
                 ref={inputRef}
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 onBlur={handleBlur}
                 onKeyDown={handleKeyDown}
                 className="text-2xl font-semibold text-gray-900 bg-transparent border border-gray-300 rounded px-2 py-1 outline-none focus:ring-0 w-full" 
                 disabled={isSaving} // Disable input while saving
                 aria-label="Edit album name"
             />
         );
    }

    return (
        <div className="flex items-center group flex-shrink-0 min-w-0 relative" style={{ paddingBottom: '1px', paddingTop: '1px' }}>
             <h2 
                className="text-2xl font-semibold text-gray-900 truncate cursor-pointer hover:bg-gray-100 px-2 py-1 rounded outline-none"
                title={name}
                onClick={handleEditClick}
                style={{ minHeight: 'calc(1.75rem + 2px + 2px)' }}
             >
                  {name}
              </h2>
         </div>
    );
}

// --- Main Page Component ---
export default function HomePage() {
  return (
    // Wrap the client component that uses the hooks in Suspense
    <Suspense fallback={<div>Loading page...</div>}>
      <PhotosApp />
    </Suspense>
  );
}

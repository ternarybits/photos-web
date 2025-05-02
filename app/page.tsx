'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Photos } from 'photos'; 
import UploadModal from './components/UploadModal';
import LeftNav from './components/LeftNav';
import AssetGrid from './components/AssetGrid';
import Header from './components/Header';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash2, Upload } from 'lucide-react';
// Import Server Actions
import {
    listAlbumsAction,
    listAssetsAction,
    createAlbumAction,
    updateAlbumAction,
    deleteAlbumAction,
    createAssetAction,
    addAssetsToAlbumAction
} from './actions';

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
        const fetchedAlbumsArray = await listAlbumsAction();
        // Sort the returned array directly, remove .data
        setAlbums(fetchedAlbumsArray.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) { // Catch unknown error type
        console.error("Error fetching albums:", err);
        // Use error message from the thrown error in the action
        const message = err instanceof Error ? err.message : "Failed to load albums.";
        setError(message);
        setAlbums([]); // Clear albums on fetch error
      } finally {
        if (showLoading) setLoadingAlbums(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  // Fetch albums on mount
  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Effect to set initial state from URL query parameters
  // This effect runs when the URL query string changes (e.g., initial load, back/forward navigation)
  useEffect(() => {
    const initialAlbumId = searchParams.get('album');
    const initialSortBy = searchParams.get('sort') as 'date' | 'quality' | null;
    const initialStack = searchParams.get('stack') === 'true';

    // Update album ID state if it differs from URL
    // Conditional check prevents unnecessary re-renders if state already matches URL
    if (initialAlbumId !== selectedAlbumId) {
        setSelectedAlbumId(initialAlbumId);
    }

    // Update sort order state if it differs from URL, defaulting to 'date'
    const validSort = initialSortBy === 'quality' ? 'quality' : 'date';
    if (validSort !== sortBy) {
        setSortBy(validSort);
    }

    // Update stack state if it differs from URL
    if (initialStack !== stackSimilar) {
        setStackSimilar(initialStack);
    }

  // ONLY depend on searchParams. The effect re-runs correctly on navigation
  // and initial load. Conditional state updates inside prevent infinite loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);

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
            // Get the plain array directly from the action, remove .data
            const assetsArray = await listAssetsAction(listParams);

            // Sort the returned array directly
            fetchedAssets = [...assetsArray].sort((a, b) => {
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
            // Use error message from the thrown error in the action
            const defaultMsg = `Failed to load assets.${selectedAlbumId ? ` Album ID: ${selectedAlbumId}` : ''}`;
            const errorMsg = err instanceof Error ? err.message : defaultMsg;
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
          // Replace SDK call with Server Action
          const newAlbum = await createAlbumAction({ name: newAlbumName });
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
          // Use error message from the thrown error in the action
          const defaultMsg = `Failed to create album "${newAlbumName}".`;
          setError(err instanceof Error ? err.message : defaultMsg);
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

  // Handler for uploading files - Refactored for Server Actions
  const handleUpload = async (files: FileList) => {
    setError(null); // Clear any previous errors
    setUploadProgress(0); // Start progress at 0
    const totalFiles = files.length;
    const uploadedAssetIds: string[] = []; // Keep track of successfully uploaded asset IDs

    try {
      // Upload each file sequentially
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];

        // Update progress before starting the upload for this file
        setUploadProgress(((i) / totalFiles) * 100);

        // Create FormData for the Server Action
        const formData = new FormData();
        formData.append('asset_data', file);
        formData.append('device_asset_id', `web-upload-${Date.now()}-${i}`);
        formData.append('device_id', 'web-client');
        formData.append('file_created_at', new Date(file.lastModified).toISOString());
        formData.append('file_modified_at', new Date(file.lastModified).toISOString());

        // Call the createAsset Server Action
        const asset = await createAssetAction(formData);
        uploadedAssetIds.push(asset.id);

        // Update progress after successful upload
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      // After all files are uploaded, add them to the album if one is selected
      if (selectedAlbumId && uploadedAssetIds.length > 0) {
        try {
            await addAssetsToAlbumAction(selectedAlbumId, uploadedAssetIds);
        } catch (addError) {
            // Log the error but don't stop the whole process; assets are uploaded
            console.error(`Error adding assets to album ${selectedAlbumId}:`, addError);
            const addErrorMsg = addError instanceof Error ? addError.message : "Unknown error";
            setError(`Files uploaded, but failed to add them to album ${selectedAlbum?.name || selectedAlbumId}. Error: ${addErrorMsg}`);
            // Proceed to refresh assets anyway
        }
      }

      // Refresh the assets list by calling fetchAssets again
      if (sortBy) { // Reuse the condition from the useEffect
          // Clear asset-related errors before fetching
          if (error?.startsWith("Failed to load assets")) setError(null);
          setLoadingAssets(true);
          let refreshedAssets: Photos.AssetResponse[] = [];
          try {
              const listParams = selectedAlbumId ? { album_id: selectedAlbumId } : {};
              // Get the plain array directly, remove .data
              const assetsArray = await listAssetsAction(listParams);
              // Re-apply sorting
              refreshedAssets = [...assetsArray].sort((a, b) => {
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
              setAssets(refreshedAssets); // Update state with the refreshed & sorted array
              // Store updated list order
               const sortedAssetIds = refreshedAssets.map(asset => asset.id);
               if (typeof window !== 'undefined') {
                   localStorage.setItem('currentAssetOrder', JSON.stringify(sortedAssetIds));
               }
          } catch (fetchErr) {
               console.error("Error refreshing assets after upload:", fetchErr);
               const fetchErrMsg = fetchErr instanceof Error ? fetchErr.message : 'Failed to refresh assets after upload.';
               setError(fetchErrMsg);
               setAssets([]); // Clear assets on fetch error
               if (typeof window !== 'undefined') {
                  try { localStorage.removeItem('currentAssetOrder'); } catch (e) { console.warn("Failed to remove item from localStorage:", e); }
               }
          } finally {
              setLoadingAssets(false);
          }
      }

    } catch (err) {
      console.error('Error uploading files:', err);
      // Use error message from the thrown error in the action
      const uploadErrMsg = err instanceof Error ? err.message : 'Failed to upload one or more files.';
      setError(uploadErrMsg);
      // Re-throw to be caught by the modal's error handling if needed
      // Consider if the modal actually needs this re-throw or if setting error state is enough
      // throw err;
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
  const updateAlbumName = async (albumId: string, newName: string): Promise<boolean> => {
      // Basic validation
      if (!newName || !newName.trim()) {
          alert("Album name cannot be empty.");
          return false; // Indicate failure
      }

      const trimmedName = newName.trim();
      // Prevent unnecessary API call if name hasn't changed
      const currentAlbum = albums.find(a => a.id === albumId);
      if (currentAlbum && currentAlbum.name === trimmedName) {
          return true; // Indicate success (no change needed)
      }

      setError(null); // Clear previous errors
      try {
          console.log(`Updating album ${albumId} to name: ${trimmedName}`);
          // Replace SDK call with Server Action
          await updateAlbumAction(albumId, { name: trimmedName });
          console.log(`Album ${albumId} updated.`);
          // Refresh the album list to show the change
          await fetchAlbums(false); // Re-fetch without showing main loading spinner
          return true; // Indicate success
      } catch (err) {
          console.error(`Error updating album ${albumId}:`, err);
          // Use error message from the thrown error in the action
          const updateErrMsg = err instanceof Error ? err.message : `Failed to update album name for ID: ${albumId}.`;
          setError(updateErrMsg);
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
      // Consider adding a specific loading indicator state for deletion if needed
      try {
          console.log(`Deleting album: ${albumId}`);
          // Replace SDK call with Server Action
          await deleteAlbumAction(albumId);
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
          // Use error message from the thrown error in the action
          const deleteErrMsg = err instanceof Error ? err.message : `Failed to delete album "${albumToDelete.name}".`;
          setError(deleteErrMsg);
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
           // Pass delete handler to LeftNav if needed there, or keep edit/delete controls in main panel
           // onDeleteAlbum={handleDeleteAlbum} // Example if delete was moved to LeftNav
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
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                size="sm"
                                value={sortBy ?? undefined} // Use current sortBy state
                                onValueChange={(value) => {
                                    // Prevent deselecting & handle empty value
                                    if (value === 'date' || value === 'quality') {
                                        handleSortChange(value);
                                    }
                                }}
                                aria-label="Sort by"
                            >
                                <ToggleGroupItem value="date" aria-label="Sort by date" className="px-3">
                                    Date
                                </ToggleGroupItem>
                                <ToggleGroupItem value="quality" aria-label="Sort by quality" className="px-3">
                                    Quality
                                </ToggleGroupItem>
                            </ToggleGroup>
                            {/* Stack Similar Switch */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="stack-similar-switch"
                                    checked={stackSimilar}
                                    onCheckedChange={handleStackToggle} // Use onCheckedChange for Switch
                                />
                                <label
                                    htmlFor="stack-similar-switch"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Stack Similar
                                </label>
                            </div>
                        </div>

                        {/* Right-aligned controls (Add, Delete) */}
                        <div className="flex space-x-2">
                            <Button
                                onClick={() => setIsUploadModalOpen(true)}
                                variant="outline"
                                size="sm"
                            >
                                <Upload className="mr-2 h-4 w-4" /> Add Photos
                            </Button>
                            {selectedAlbumId && (
                                <Button
                                    onClick={() => handleDeleteAlbum(selectedAlbumId)}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Album
                                </Button>
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
        const trimmedName = name.trim();
        // Only save if the name actually changed and is not empty
        if (trimmedName !== initialName && trimmedName !== '') {
            setIsSaving(true);
            const success = await onSave(albumId, trimmedName);
            if (!success) {
                 // Revert name if save failed
                 setName(initialName);
                 alert("Failed to save album name."); // Consider a less intrusive error display
            } else {
                // If save was successful, the parent component will re-fetch and
                // pass the new initialName, triggering the useEffect to update local state.
                // No need to manually set `name` here if `initialName` updates correctly.
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
                title={name} // Use state `name` for the title tooltip
                onClick={handleEditClick}
                style={{ minHeight: 'calc(1.75rem + 2px + 2px)' }} // Ensure consistent height
             >
                  {name} {/* Display current state `name` */}
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

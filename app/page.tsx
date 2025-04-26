'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Photos from 'photos';
import UploadModal from './components/UploadModal';
import LeftNav from './components/LeftNav';
import AssetGrid from './components/AssetGrid';

// Initialize the Photos SDK client
// Note: Authentication details might be needed later.
// Add a dummy apiKey to satisfy the SDK's requirement
const photosClient = new Photos({
  apiKey: 'dummy-api-key', // Provide a placeholder API key
});

// --- Component Prop Types ---

interface MainContentProps {
  selectedAlbumId: string | null;
  onUpdateAlbumName: (albumId: string, newName: string) => Promise<boolean>;
  onDeleteAlbum: (albumId: string) => Promise<void>;
  assets: Photos.AssetResponse[];
  title: string;
  isLoadingAssets: boolean;
  sortBy: 'date' | 'quality';
  stackSimilar: boolean;
  onSortChange: (sortBy: 'date' | 'quality') => void;
  onStackToggle: () => void;
  onAddPhotosClick: () => void;
}

// --- Components ---

// Define Header without FC type or empty props interface
const Header = () => (
  <header className="bg-gray-100 p-4 border-b">
    <h1 className="text-xl font-semibold">Photos</h1>
    {/* Placeholder for profile/settings */}
    <div className="absolute top-4 right-4">Profile</div>
  </header>
);

// Updated MainContent to handle inline title editing
const MainContent: React.FC<MainContentProps> = ({
    selectedAlbumId,
    onUpdateAlbumName,
    onDeleteAlbum,
    assets,
    title,
    isLoadingAssets,
    sortBy,
    stackSimilar,
    onSortChange,
    onStackToggle,
    onAddPhotosClick
}) => {
    // State for inline editing
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const inputRef = React.useRef<HTMLInputElement>(null); // Ref for focusing input

    // Update local editedTitle if the main title prop changes (e.g., album changes)
    useEffect(() => {
        setEditedTitle(title);
    }, [title]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingTitle) {
            inputRef.current?.focus();
            inputRef.current?.select(); // Select text for easy replacement
        }
    }, [isEditingTitle]);

    const handleTitleClick = () => {
        // Only allow editing if an album is selected (not "All Photos")
        if (selectedAlbumId) {
            setEditedTitle(title); // Reset edit field to current title
            setIsEditingTitle(true);
        }
    };

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEditedTitle(event.target.value);
    };

    const saveTitle = async () => {
        if (!selectedAlbumId) return; // Should not happen if editing started correctly

        const originalTitle = title;
        setIsEditingTitle(false); // Exit editing mode immediately for better UX

        if (editedTitle.trim() === originalTitle) {
            return; // No change, do nothing
        }

        const success = await onUpdateAlbumName(selectedAlbumId, editedTitle.trim());

        if (!success) {
            // Revert local state if update failed
            setEditedTitle(originalTitle);
            // Error message is handled in HomePage state
        }
        // If successful, HomePage will re-fetch and pass down the new title via props
    };

    const handleInputBlur = () => {
        // Save on blur
        saveTitle();
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            saveTitle();
        } else if (event.key === 'Escape') {
            setEditedTitle(title); // Revert changes
            setIsEditingTitle(false); // Exit editing mode
        }
    };

    return (
       <main className="flex-1 p-6 overflow-y-auto flex flex-col">
        {/* Title Section - Conditional Rendering */}
        <div className="mb-4 flex-shrink-0">
           {isEditingTitle ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editedTitle}
                    onChange={handleTitleChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="text-2xl font-semibold p-1 border border-blue-500 rounded w-full sm:w-auto" // Basic styling
                 />
           ) : (
               <h2
                  className={`text-2xl font-semibold ${selectedAlbumId ? 'cursor-pointer hover:bg-gray-100 rounded px-1' : ''}`} // Add cursor/hover only if editable
                  onClick={handleTitleClick}
                  title={selectedAlbumId ? "Click to rename album" : ""} // Tooltip
               >
                   {title}
               </h2>
           )}
         </div>

        {/* Controls Row */}
        <div className="flex justify-between items-center mb-4 border-b pb-2 flex-shrink-0">
          {/* Filter/Sort controls */}
          <div className="flex gap-4 text-sm">
            {/* Sort Buttons */}
            <div className="flex items-center gap-1">
                <span className="text-gray-600">Sort:</span>
                 <button
                    onClick={() => onSortChange('date')}
                    className={`px-2 py-1 rounded ${sortBy === 'date' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
                 >
                    By Date
                 </button>
                 <button
                     onClick={() => onSortChange('quality')}
                     className={`px-2 py-1 rounded ${sortBy === 'quality' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
                  >
                     By Quality
                 </button>
            </div>
             {/* Stack Toggle Button */}
             <div className="flex items-center gap-1">
                 <span className="text-gray-600">Stack Similar:</span>
                 <button
                     onClick={onStackToggle}
                     className={`px-2 py-1 rounded ${stackSimilar ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
                 >
                     {stackSimilar ? 'On' : 'Off'}
                 </button>
             </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
             <button className="bg-green-500 text-white p-2 rounded text-sm cursor-pointer hover:bg-green-600" onClick={onAddPhotosClick}>Add Photos</button>
             {/* Conditionally render Delete Album button */}
             {selectedAlbumId && (
                 <button
                     className="bg-red-500 text-white p-2 rounded text-sm cursor-pointer hover:bg-red-600"
                     onClick={() => onDeleteAlbum(selectedAlbumId)}
                 >
                     Delete Album
                 </button>
             )}
          </div>
        </div>
        {/* Use AssetGrid component */}
        <div className="flex-grow overflow-y-auto">
            <AssetGrid assets={assets} isLoadingAssets={isLoadingAssets} sortBy={sortBy} />
        </div>
       </main>
    );
};

// --- Extracted Client Component ---
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

  // Add state for sorting and stacking
  // Initialize sortBy state to null initially, will be set by useEffect
  const [sortBy, setSortBy] = useState<'date' | 'quality' | null>(null);
  const [stackSimilar, setStackSimilar] = useState(false); // Default to off

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

  // Effect to set initial album selection and sort order from URL query parameters
  useEffect(() => {
    const initialAlbumId = searchParams.get('album');
    const initialSortBy = searchParams.get('sort') as 'date' | 'quality' | null;

    // Update album ID if different from URL
    if (initialAlbumId !== selectedAlbumId) {
        setSelectedAlbumId(initialAlbumId);
    }

    // Update sort order if different from URL, defaulting to 'date'
    const validSort = initialSortBy === 'quality' ? 'quality' : 'date'; // Default to date
    if (validSort !== sortBy) {
        setSortBy(validSort);
    }

    // Only run this effect when searchParams changes
  }, [searchParams, selectedAlbumId, sortBy]);

  // Fetch assets when selectedAlbumId, loadingAlbums, or sortBy changes
  useEffect(() => {
    const fetchAssets = async () => {
        // Clear only asset-related errors
        if (error?.startsWith("Failed to load assets")) setError(null);
        setLoadingAssets(true);
        const fetchedAssets: Photos.AssetResponse[] = [];
        try {
            const listParams = selectedAlbumId ? { album_id: selectedAlbumId } : {};
            for await (const asset of photosClient.assets.list(listParams)) {
                fetchedAssets.push(asset);
            }
            setAssets(fetchedAssets);

            // --- Add localStorage logic --- 
            // Sort the fetched assets based on the current sortBy state
            const sortedAssets = [...fetchedAssets].sort((a, b) => {
                if (sortBy === 'date') {
                    return new Date(b.local_datetime).getTime() - new Date(a.local_datetime).getTime();
                } else {
                    const aScore = a.metrics ? Object.values(a.metrics)[0] || 0 : 0;
                    const bScore = b.metrics ? Object.values(b.metrics)[0] || 0 : 0;
                    return (bScore as number) - (aScore as number);
                }
            });

            // Extract just the IDs
            const sortedAssetIds = sortedAssets.map(asset => asset.id);

            // Store in localStorage
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('currentAssetOrder', JSON.stringify(sortedAssetIds));
                } catch (storageError) {
                    console.error("Error saving asset order to localStorage:", storageError);
                    // Handle potential storage errors (e.g., quota exceeded)
                }
            }
            // --- End localStorage logic ---

        } catch (err) {
            console.error("Error fetching assets:", err);
            setError(`Failed to load assets.${selectedAlbumId ? ` Album ID: ${selectedAlbumId}`: ''}`);
            setAssets([]);
            // Clear localStorage on error?
            if (typeof window !== 'undefined') {
                 try { localStorage.removeItem('currentAssetOrder'); } catch (e) {
                    // Log or handle the error if necessary
                    console.warn("Failed to remove item from localStorage:", e);
                 }
            }
        } finally {
            setLoadingAssets(false);
        }
    };
    if (!loadingAlbums) { // Ensure albums (potentially empty list) are loaded before fetching assets
        fetchAssets();
    }
   }, [selectedAlbumId, loadingAlbums, sortBy, error]);

   // Helper function to update URL with current album and sort parameters
   const updateUrlParams = useCallback((albumId: string | null, currentSortBy: 'date' | 'quality') => {
       const current = new URLSearchParams(Array.from(searchParams.entries()));

       if (!albumId) {
           current.delete('album');
       } else {
           current.set('album', albumId);
       }

       // Always set the sort parameter
       current.set('sort', currentSortBy);

       const search = current.toString();
       const query = search ? `?${search}` : "";
       router.replace(`${pathname}${query}`);
   }, [pathname, router, searchParams]);

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
             updateUrlParams(newAlbum.id, sortBy);
           }

       } catch (err) {
           console.error("Error creating album:", err);
           setError(`Failed to create album "${newAlbumName}".`);
           // Handle specific API errors if needed
       } finally {
           // Optional: Reset loading indicator state here
       }
   };

   // Handlers for sort and stack changes
   const handleSortChange = (newSortBy: 'date' | 'quality') => {
       if (newSortBy !== sortBy) {
           setSortBy(newSortBy);
           updateUrlParams(selectedAlbumId, newSortBy); // Update URL with new sort
           console.log("Sort changed to:", newSortBy);
       }
   };

   const handleStackToggle = () => {
       setStackSimilar(prev => !prev);
       // TODO: Apply/remove stacking logic locally based on the new `stackSimilar` state.
       // This logic should ideally happen where `displayedAssets` is determined.
       console.log("Stack similar toggled to:", !stackSimilar);
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

           // Navigate back to All Photos
           // Setting state will trigger the useEffect for URL update
           setSelectedAlbumId(null);
           // Explicitly update URL immediately (though useEffect should handle it too)
           updateUrlParams(null, sortBy ?? 'date'); 

       } catch (err) {
           console.error(`Error deleting album ${albumId}:`, err);
           setError(`Failed to delete album "${albumToDelete.name}".`);
           // Optionally re-fetch albums to ensure consistency even on error
           // await fetchAlbums(false);
       }
   };

   const selectedAlbum = albums.find(album => album.id === selectedAlbumId);
   const mainTitle = selectedAlbum ? selectedAlbum.name : "All Photos";

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
       setAssets(fetchedAssets);

     } catch (err) {
       console.error('Error uploading files:', err);
       setError('Failed to upload one or more files.');
       throw err; // Re-throw to be caught by the modal's error handling
     } finally {
        setUploadProgress(null); // Reset progress on completion or error
     }
   };

  return (
    <div className="flex flex-col h-screen bg-white">
         <Header />
         {error && <div className="p-2 bg-red-100 text-red-700 text-center text-sm flex-shrink-0">{error}</div>}
         <div className="flex flex-1 overflow-hidden">
          <LeftNav
             albums={albums}
             selectedAlbumId={selectedAlbumId}
             isLoadingAlbums={loadingAlbums}
             onNewAlbumClick={handleNewAlbumClick}
           />
           {/* Only render MainContent if sortBy has been initialized */}
           {sortBy && (
              <MainContent
                selectedAlbumId={selectedAlbumId}
                onUpdateAlbumName={updateAlbumName}
                onDeleteAlbum={handleDeleteAlbum}
                assets={assets}
                title={mainTitle}
                isLoadingAssets={loadingAssets}
                sortBy={sortBy}
                stackSimilar={stackSimilar}
                onSortChange={handleSortChange}
                onStackToggle={handleStackToggle}
                onAddPhotosClick={() => setIsUploadModalOpen(true)}
              />
           )}
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

// --- Main Page Component ---
export default function HomePage() {
  return (
    // Wrap the client component that uses the hooks in Suspense
    <Suspense fallback={<div>Loading page...</div>}>
      <PhotosApp />
    </Suspense>
  );
}

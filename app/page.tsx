'use client';

import React, { useState, useEffect } from 'react';
import Photos from 'photos';
import Link from 'next/link';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import UploadModal from './components/UploadModal';

// Initialize the Photos SDK client
// Note: Authentication details might be needed later.
// Add a dummy apiKey to satisfy the SDK's requirement
const photosClient = new Photos({
  apiKey: 'dummy-api-key', // Provide a placeholder API key
});

// --- Component Prop Types ---
// Removed HeaderProps

interface AlbumListProps {
  albums: Photos.AlbumResponse[];
  selectedAlbumId: string | null;
  onSelectAlbum: (albumId: string | null) => void;
  isLoading: boolean;
}

interface LeftNavProps {
  albums: Photos.AlbumResponse[];
  selectedAlbumId: string | null;
  onSelectAlbum: (albumId: string | null) => void;
  isLoadingAlbums: boolean;
  onNewAlbumClick: () => void;
}

interface AssetThumbnailProps {
    asset: Photos.AssetResponse;
}

interface AssetGridProps {
    assets: Photos.AssetResponse[];
    isLoadingAssets: boolean;
    sortBy: 'date' | 'quality';
}

interface MainContentProps {
  selectedAlbumId: string | null;
  onUpdateAlbumName: (albumId: string, newName: string) => Promise<boolean>;
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

// Define AlbumList component before LeftNav
const AlbumList: React.FC<AlbumListProps> = ({ albums, selectedAlbumId, onSelectAlbum, isLoading }) => (
   <ul className="overflow-y-auto flex-grow">
    {isLoading ? (
      <li className="p-1 text-gray-500 italic">Loading albums...</li>
    ) : (
      <>
        <li
          key="all"
          className={`p-1 hover:bg-gray-200 rounded cursor-pointer ${!selectedAlbumId ? 'bg-gray-200 font-semibold' : ''}`}
          onClick={() => onSelectAlbum(null)}
        >
          All Photos
        </li>
        {albums.map((album) => (
          <li
            key={album.id}
            className={`p-1 hover:bg-gray-200 rounded cursor-pointer truncate ${selectedAlbumId === album.id ? 'bg-gray-200 font-semibold' : ''}`}
            onClick={() => onSelectAlbum(album.id)}
            title={album.name}
          >
            {album.name}
          </li>
        ))}
        {albums.length === 0 && !isLoading && (
            <li className="p-1 text-gray-500 italic">No albums found.</li>
        )}
      </>
    )}
  </ul>
);

// Define LeftNav, which uses AlbumList
const LeftNav: React.FC<LeftNavProps> = ({
    albums,
    selectedAlbumId,
    onSelectAlbum,
    isLoadingAlbums,
    onNewAlbumClick
}) => (
  <nav className="w-64 bg-gray-50 p-4 border-r flex flex-col flex-shrink-0">
    <button
        className="w-full bg-blue-500 text-white p-2 rounded mb-4 flex-shrink-0 text-sm hover:bg-blue-600 cursor-pointer"
        onClick={onNewAlbumClick}
    >
        New Album
    </button>
    <h2 className="text-lg font-medium mb-2 flex-shrink-0">Albums</h2>
    <AlbumList
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        onSelectAlbum={onSelectAlbum}
        isLoading={isLoadingAlbums}
    />
  </nav>
);

// Define AssetThumbnail component using Next/Image
const AssetThumbnail: React.FC<AssetThumbnailProps> = ({ asset }) => {
    const [imgError, setImgError] = useState(false);
    const thumbnailUrl = imgError ? null : (asset.thumbnail_url || null);

    return (
        <Link href={`/asset/${asset.id}`} passHref>
            <div
                className="bg-gray-200 aspect-square flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:ring-2 ring-blue-500 rounded overflow-hidden relative" // Added relative for fill layout
                title={`Asset ID: ${asset.id}`} // Tooltip for ID
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
        // Group by quality buckets
        const qualityBuckets = {
            'top': sortedAssets.filter(asset => {
                const score = asset.metrics ? Object.values(asset.metrics)[0] || 0 : 0;
                return (score as number) >= 0.99;
            }),
            'excellent': sortedAssets.filter(asset => {
                const score = asset.metrics ? Object.values(asset.metrics)[0] || 0 : 0;
                return (score as number) >= 0.8 && (score as number) < 0.99;
            }),
            'good': sortedAssets.filter(asset => {
                const score = asset.metrics ? Object.values(asset.metrics)[0] || 0 : 0;
                return (score as number) >= 0.6 && (score as number) < 0.8;
            }),
            'okay': sortedAssets.filter(asset => {
                const score = asset.metrics ? Object.values(asset.metrics)[0] || 0 : 0;
                return (score as number) >= 0.4 && (score as number) < 0.6;
            }),
            'poor': sortedAssets.filter(asset => {
                const score = asset.metrics ? Object.values(asset.metrics)[0] || 0 : 0;
                return (score as number) >= 0.2 && (score as number) < 0.4;
            }),
            'bad': sortedAssets.filter(asset => {
                const score = asset.metrics ? Object.values(asset.metrics)[0] || 0 : 0;
                return (score as number) < 0.2;
            })
        };

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

// Updated MainContent to handle inline title editing
const MainContent: React.FC<MainContentProps> = ({
    selectedAlbumId,
    onUpdateAlbumName,
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
          {/* Placeholder for actions */}
          <button className="bg-green-500 text-white p-2 rounded text-sm cursor-pointer hover:bg-green-600" onClick={onAddPhotosClick}>Add Photos</button>
        </div>
        {/* Use AssetGrid component */}
        <div className="flex-grow overflow-y-auto">
            <AssetGrid assets={assets} isLoadingAssets={isLoadingAssets} sortBy={sortBy} />
        </div>
       </main>
    );
};

export default function HomePage() {
  // Indicate this is a client component
  'use client';

  // Use defined types for state
  const [albums, setAlbums] = useState<Photos.AlbumResponse[]>([]);
  const [assets, setAssets] = useState<Photos.AssetResponse[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for sorting and stacking
  const [sortBy, setSortBy] = useState<'date' | 'quality'>('date'); // Default to date
  const [stackSimilar, setStackSimilar] = useState(false); // Default to off

  // Add state for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Function to fetch albums (can be reused)
  const fetchAlbums = async (showLoading = true) => {
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
    };

  // Fetch albums on mount
  useEffect(() => {
    fetchAlbums();
  }, []); // Run only once on mount


  // Fetch assets when selectedAlbumId, loadingAlbums, or sortBy changes
  useEffect(() => {
    const fetchAssets = async () => {
        // Clear only asset-related errors
        if (error?.startsWith("Failed to load assets")) setError(null);
        setLoadingAssets(true);
        let fetchedAssets: Photos.AssetResponse[] = [];
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
                 try { localStorage.removeItem('currentAssetOrder'); } catch (e) {}
            }
        } finally {
            setLoadingAssets(false);
        }
    };
    if (!loadingAlbums) { // Ensure albums (potentially empty list) are loaded before fetching assets
        fetchAssets();
    }
   // Add sortBy to dependency array
   }, [selectedAlbumId, loadingAlbums, error, sortBy]); // Re-run when selectedAlbumId, loadingAlbums, or sortBy changes


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

       } catch (err) {
           console.error("Error creating album:", err);
           setError(`Failed to create album "${newAlbumName}".`);
           // Handle specific API errors if needed
       } finally {
           // Optional: Reset loading indicator state here
       }
   };


   const handleSelectAlbum = (albumId: string | null) => {
     if (albumId !== selectedAlbumId) {
        setSelectedAlbumId(albumId);
     }
   };

   // Handlers for sort and stack changes
   const handleSortChange = (newSortBy: 'date' | 'quality') => {
       setSortBy(newSortBy);
       // TODO: Re-sort existing assets locally OR potentially re-fetch with sort param if API supports it.
       // The sorting logic should ideally happen where `displayedAssets` is determined (e.g., in AssetGrid or before passing assets down).
       console.log("Sort changed to:", newSortBy);
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
           onSelectAlbum={handleSelectAlbum}
           isLoadingAlbums={loadingAlbums}
           onNewAlbumClick={handleNewAlbumClick}
         />
         <MainContent
            selectedAlbumId={selectedAlbumId}
            onUpdateAlbumName={updateAlbumName}
            assets={assets}
            title={mainTitle}
            isLoadingAssets={loadingAssets}
            sortBy={sortBy}
            stackSimilar={stackSimilar}
            onSortChange={handleSortChange}
            onStackToggle={handleStackToggle}
            onAddPhotosClick={() => setIsUploadModalOpen(true)}
         />
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

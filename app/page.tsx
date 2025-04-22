'use client';

import React, { useState, useEffect } from 'react';
import Photos from 'photos'; // Assuming the SDK package is named 'photos'

// Initialize the Photos SDK client
// Note: Authentication details might be needed later.
const photosClient = new Photos();

// --- Type Definitions (Ideally import from SDK) ---
interface Album {
  id: string;
  name: string;
  // Add other relevant album properties if known
}

interface Asset {
  id: string;
  // Add other relevant asset properties if known (e.g., thumbnail_url, type)
}

// --- Component Prop Types ---
// Removed HeaderProps

interface AlbumListProps {
  albums: Album[];
  selectedAlbumId: string | null;
  onSelectAlbum: (albumId: string | null) => void;
  isLoading: boolean;
}

interface LeftNavProps {
  albums: Album[];
  selectedAlbumId: string | null;
  onSelectAlbum: (albumId: string | null) => void;
  isLoadingAlbums: boolean;
}

interface AssetThumbnailProps {
    asset: Asset;
}

interface AssetGridProps {
    assets: Asset[];
    isLoadingAssets: boolean;
}

interface MainContentProps {
  assets: Asset[];
  title: string;
  isLoadingAssets: boolean;
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
const LeftNav: React.FC<LeftNavProps> = ({ albums, selectedAlbumId, onSelectAlbum, isLoadingAlbums }) => (
  <nav className="w-64 bg-gray-50 p-4 border-r flex flex-col flex-shrink-0">
    <button className="w-full bg-blue-500 text-white p-2 rounded mb-4 flex-shrink-0 text-sm">New Album</button>
    <h2 className="text-lg font-medium mb-2 flex-shrink-0">Albums</h2>
    {/* Now AlbumList is defined */}
    <AlbumList
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        onSelectAlbum={onSelectAlbum}
        isLoading={isLoadingAlbums}
    />
  </nav>
);

// Define AssetThumbnail component
const AssetThumbnail: React.FC<AssetThumbnailProps> = ({ asset }) => {
    // TODO: Add click handler to navigate to detail view
    // TODO: Display actual thumbnail image/video icon
    return (
        <div
            key={asset.id}
            className="bg-gray-200 aspect-square flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:ring-2 ring-blue-500 rounded overflow-hidden"
            title={`Asset ID: ${asset.id}`} // Tooltip for ID
        >
            {/* Placeholder content */}
            <span className="block p-1 text-center">Asset {asset.id.substring(0, 6)}...</span>
         </div>
    );
};

// Define AssetGrid component
const AssetGrid: React.FC<AssetGridProps> = ({ assets, isLoadingAssets }) => {
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

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {assets.map((asset: Asset) => (
                <AssetThumbnail key={asset.id} asset={asset} />
            ))}
        </div>
    );
};

// Define MainContent, which uses AssetGrid
const MainContent: React.FC<MainContentProps> = ({ assets, title, isLoadingAssets }) => (
   <main className="flex-1 p-6 overflow-y-auto flex flex-col">
    <h2 className="text-2xl font-semibold mb-4 flex-shrink-0">{title}</h2>
    <div className="flex justify-between items-center mb-4 border-b pb-2 flex-shrink-0">
      {/* Placeholder for filters */}
      <div className="flex gap-4">
         {/* TODO: Implement Filter/Sort state and buttons */}
        <span className="text-sm text-gray-600">Sort: By Date | By Quality</span>
        <span className="text-sm text-gray-600">Stack Similar: Off | On</span>
      </div>
      {/* Placeholder for actions */}
      <button className="bg-green-500 text-white p-2 rounded text-sm">Add Photos</button>
    </div>
    {/* Use AssetGrid component */}
    <div className="flex-grow overflow-y-auto"> {/* Allow grid to scroll independently if needed */}
        <AssetGrid assets={assets} isLoadingAssets={isLoadingAssets} />
    </div>
  </main>
);

export default function HomePage() {
  // Indicate this is a client component
  'use client';

  // Use defined types for state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch albums on mount
  useEffect(() => {
    const fetchAlbums = async () => {
      setLoadingAlbums(true);
      setError(null);
      try {
        const fetchedAlbums: Album[] = []; // Use Album type
        // Use auto-pagination to get all albums
        // Need to cast the result if the SDK doesn't provide typed iterators
        for await (const album of photosClient.albums.list()) {
           // Assuming 'album' matches the Album interface or needs casting
           fetchedAlbums.push(album as Album);
        }
        fetchedAlbums.sort((a, b) => a.name.localeCompare(b.name));
        setAlbums(fetchedAlbums);
      } catch (err) {
        console.error("Error fetching albums:", err);
        setError("Failed to load albums.");
      } finally {
        setLoadingAlbums(false);
      }
    };
    fetchAlbums();
  }, []);

  // Fetch assets when selectedAlbumId changes
   useEffect(() => {
     const fetchAssets = async () => {
       setLoadingAssets(true);
       setError(null);
       const fetchedAssets: Asset[] = []; // Use Asset type
       try {
         const listParams = selectedAlbumId ? { album_id: selectedAlbumId } : {};
         // Use auto-pagination to get all assets
         // Need to cast the result if the SDK doesn't provide typed iterators
         for await (const asset of photosClient.assets.list(listParams)) {
           // Assuming 'asset' matches the Asset interface or needs casting
           fetchedAssets.push(asset as Asset);
         }
         setAssets(fetchedAssets);
       } catch (err) {
         console.error("Error fetching assets:", err);
         setError(`Failed to load assets.${selectedAlbumId ? ` Album ID: ${selectedAlbumId}`: ''}`);
         setAssets([]); // Clear assets on error
       } finally {
         setLoadingAssets(false);
       }
     };
     // Only fetch if albums have loaded (or initially)
     // Avoids fetching assets for potentially non-existent album ID if albums load slowly
     if (!loadingAlbums) {
        fetchAssets();
     }
   }, [selectedAlbumId, loadingAlbums]); // Re-run when selectedAlbumId or loadingAlbums changes


   const handleSelectAlbum = (albumId: string | null) => {
     if (albumId !== selectedAlbumId) {
        setSelectedAlbumId(albumId);
     }
   };

   // Determine the title for MainContent
   const selectedAlbum = albums.find(album => album.id === selectedAlbumId);
   const mainTitle = selectedAlbum ? selectedAlbum.name : "All Photos";


  return (
    <div className="flex flex-col h-screen bg-white">
       <Header />
       {error && <div className="p-2 bg-red-100 text-red-700 text-center text-sm flex-shrink-0">{error}</div>}
       <div className="flex flex-1 overflow-hidden">
        {/* TODO: Add loading state for albums */}
        <LeftNav
           albums={albums}
           selectedAlbumId={selectedAlbumId}
           onSelectAlbum={handleSelectAlbum}
           isLoadingAlbums={loadingAlbums}
         />
         {/* TODO: Add loading state for assets */}
         <MainContent
            assets={assets}
            title={mainTitle}
            isLoadingAssets={loadingAssets}
         />
      </div>
    </div>
  );
}

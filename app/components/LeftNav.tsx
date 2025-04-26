'use client';

import React from 'react';
import Photos from 'photos'; // Assuming Photos SDK types are importable
import Link from 'next/link'; // Import Link
import { useSearchParams } from 'next/navigation'; // Import useSearchParams

// --- Component Prop Types ---

interface AlbumListProps {
  albums: Photos.AlbumResponse[];
  selectedAlbumId: string | null;
  isLoading: boolean;
}

interface LeftNavProps {
  albums: Photos.AlbumResponse[];
  selectedAlbumId: string | null;
  isLoadingAlbums: boolean;
  onNewAlbumClick: () => void;
}

// --- Components ---

// Define AlbumList component
const AlbumList: React.FC<AlbumListProps> = ({ albums, selectedAlbumId, isLoading }) => {
   const searchParams = useSearchParams(); // Get current search params

   // Helper to construct href, preserving sort param
   const getLinkHref = (albumId: string | null) => {
       const current = new URLSearchParams(Array.from(searchParams.entries()));
       if (albumId) {
           current.set('album', albumId);
       } else {
           current.delete('album');
       }
       const search = current.toString();
       return `/?${search}`; // Assuming base path is root
   };

   return (
      <ul className="overflow-y-auto flex-grow">
          {isLoading ? (
              <li className="p-1 text-gray-500 italic">Loading albums...</li>
          ) : (
              <>
                  <li
                      key="all"
                      className={`rounded ${!selectedAlbumId ? 'bg-gray-200 font-semibold' : ''}`}
                  >
                      <Link
                          href={getLinkHref(null)}
                          className={`block p-1 hover:bg-gray-200 rounded cursor-pointer`}
                      >
                          All Photos
                      </Link>
                  </li>
                  {albums.map((album) => (
                      <li
                          key={album.id}
                          className={`rounded ${selectedAlbumId === album.id ? 'bg-gray-200 font-semibold' : ''}`}
                          title={album.name}
                      >
                          <Link
                              href={getLinkHref(album.id)}
                              className={`block p-1 hover:bg-gray-200 rounded cursor-pointer truncate`}
                          >
                              {album.name}
                          </Link>
                      </li>
                  ))}
                  {albums.length === 0 && !isLoading && (
                      <li className="p-1 text-gray-500 italic">No albums found.</li>
                  )}
              </>
          )}
      </ul>
   );
};

// Define LeftNav
const LeftNav: React.FC<LeftNavProps> = ({
    albums,
    selectedAlbumId,
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
        isLoading={isLoadingAlbums}
    />
  </nav>
);

export default LeftNav; 
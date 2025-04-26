'use client';

import React from 'react';
import Photos from 'photos'; // Assuming Photos SDK types are importable

// --- Component Prop Types ---

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

// --- Components ---

// Define AlbumList component
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

// Define LeftNav
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

export default LeftNav; 
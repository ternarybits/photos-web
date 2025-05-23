'use client';

import React, { useState } from 'react';
import type { Photos } from "photos";
import { Image as ImageIconPlaceholder } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// --- Person Thumbnail Component ---
export interface PersonThumbnailProps {
    person: Photos.PersonResponse;
}

export const PersonThumbnail: React.FC<PersonThumbnailProps> = ({ person }) => {
    const [imgLoadError, setImgLoadError] = useState(false);

    const renderThumbnail = () => {
        const thumbnailUrl = person.thumbnail_face_url && !imgLoadError
            ? `${person.thumbnail_face_url}${person.thumbnail_face_url.includes('?') ? '&' : '?'}size=thumbnail`
            : null;

        if (!thumbnailUrl) {
            return (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0" title={imgLoadError ? "Image load failed" : "Thumbnail URL missing or invalid"}>
                    <ImageIconPlaceholder size={20} className="text-gray-500" />
                </div>
            );
        }

        return (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600 flex-shrink-0 relative">
                <Image
                    src={thumbnailUrl}
                    alt={`Face of ${person.name || 'person'}`}
                    fill
                    sizes="40px"
                    style={{ objectFit: 'cover' }}
                    unoptimized={process.env.NODE_ENV === 'development'}
                    onError={() => {
                        console.warn(`Error loading face thumbnail for person ${person.id} from URL: ${thumbnailUrl}`);
                        setImgLoadError(true);
                    }}
                />
            </div>
        );
    };

    return (
        <li key={person.id} className="min-h-[40px]">
            <Link href={`/people/${person.id}`} className="flex items-center space-x-3 hover:bg-gray-700 p-1 rounded-md transition-colors duration-150 group">
                {renderThumbnail()}
                <span className="text-gray-300 truncate group-hover:text-white">
                    {person.name || `${person.id.substring(0,8)}...`}
                </span>
            </Link>
        </li>
    );
};

export default PersonThumbnail;
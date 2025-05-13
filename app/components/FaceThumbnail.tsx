'use client';

import React, { useState } from 'react';
import type { Photos } from "photos";
import { Image as ImageIconPlaceholder } from 'lucide-react';
import Image from 'next/image';

export interface FaceThumbnailProps {
    face: Photos.FaceResponse;
    showPersonName?: boolean; // Optional: to show associated person's name if available
    peopleMap?: Map<string, Photos.PersonResponse>; // Optional: for resolving person_id to name
}

export const FaceThumbnail: React.FC<FaceThumbnailProps> = ({ face, showPersonName, peopleMap }) => {
    const [imgLoadError, setImgLoadError] = useState(false);

    const thumbnailUrl = face.thumbnail_url && !imgLoadError
        ? `${face.thumbnail_url}${face.thumbnail_url.includes('?') ? '&' : '?'}size=thumbnail`
        : null;
    
    let personName: string | null = null;
    if (showPersonName && face.person_id && peopleMap) {
        personName = peopleMap.get(face.person_id)?.name || `Person ${face.person_id.substring(0,6)}`;
    }

    const renderImage = () => {
        if (!thumbnailUrl) {
            return (
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0" title={imgLoadError ? "Image load failed" : "Thumbnail URL missing"}>
                    <ImageIconPlaceholder size={30} className="text-gray-500" />
                </div>
            );
        }
        return (
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 flex-shrink-0 relative">
                <Image
                    src={thumbnailUrl}
                    alt={`Face ${face.id}`}
                    fill
                    sizes="64px" // Corresponds to w-16 h-16 (1rem = 16px typically)
                    style={{ objectFit: 'cover' }}
                    unoptimized={process.env.NODE_ENV === 'development'}
                    onError={() => {
                        console.warn(`Error loading face thumbnail for face ${face.id} from URL: ${thumbnailUrl}`);
                        setImgLoadError(true);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-1">
            {renderImage()}
            {showPersonName && personName && (
                <span className="text-xs text-gray-400 truncate max-w-[64px]" title={personName}>{personName}</span>
            )}
            {showPersonName && !personName && face.person_id && (
                 <span className="text-xs text-gray-500 italic max-w-[64px]">Unknown Person</span>
            )}
        </div>
    );
};

export default FaceThumbnail; 
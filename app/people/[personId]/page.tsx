'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { retrievePersonAction, listAssetsAction } from '@/app/actions'; // Updated actions
import type { Photos } from 'photos';
import AssetThumbnail from '@/app/components/AssetThumbnail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function PersonAssetsPage() {
  const params = useParams();
  const personId = params.personId as string;

  const [person, setPerson] = useState<Photos.PersonResponse | null>(null);
  const [assets, setAssets] = useState<Photos.AssetResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonAndAssets = useCallback(async () => {
    if (!personId) return;

    setIsLoading(true);
    setError(null);
    try {
      // Fetch person details
      const personDataPromise = retrievePersonAction(personId);
      // Fetch assets for the person
      const assetsDataPromise = listAssetsAction({ person_id: personId });

      const [personData, assetsData] = await Promise.all([personDataPromise, assetsDataPromise]);
      
      setPerson(personData);
      setAssets(assetsData);

    } catch (err) {
      console.error(`Failed to fetch data for person ${personId}:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
    setIsLoading(false);
  }, [personId]);

  useEffect(() => {
    fetchPersonAndAssets();
  }, [fetchPersonAndAssets]);

  if (isLoading) {
    return (
        <div className="p-4 flex flex-col items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-lg">Loading assets...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="p-4 flex flex-col items-center">
            <p className="text-red-500 text-lg mb-4">Error: {error}</p>
            <Button onClick={fetchPersonAndAssets} variant="outline">Try again</Button>
            <Link href="/people" className="mt-4">
                <Button variant="link"><ArrowLeft className="mr-2 h-4 w-4" />Back to People</Button>
            </Link>
        </div>
    );
  }

  if (!person) {
    return (
        <div className="p-4 flex flex-col items-center">
            <p className="text-lg mb-4">Person not found.</p>
            <Link href="/people">
                <Button variant="link"><ArrowLeft className="mr-2 h-4 w-4" />Back to People</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center">
        <Link href="/people" className="mr-4">
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        </Link>
        <h1 className="text-3xl font-semibold">
          Photos of {person.name || 'Unnamed Person'}
        </h1>
      </div>

      {assets.length === 0 ? (
        <p>No photos found for this person.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          {assets.map((asset) => (
            <AssetThumbnail key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

export default PersonAssetsPage; 
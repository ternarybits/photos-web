'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { EditablePerson } from './types'; 

interface PersonCardProps {
  person: EditablePerson;
  isEditing: boolean;
  onEditToggle: (personId: string) => void;
  onSaveChanges: (personId: string, newName: string) => void;
}

function PersonCard({ person, isEditing, onEditToggle, onSaveChanges }: PersonCardProps) {
  const [newName, setNewName] = useState(person.name || '');

  // Reset newName if person.name changes or if edit mode is toggled
  useEffect(() => {
    setNewName(person.name || ''); 
  }, [isEditing, person.name]);

  const handleSave = () => {
    onSaveChanges(person.id, newName);
  };

  const handleCancel = () => {
    onEditToggle(person.id); // This will also trigger the useEffect above to reset newName via isEditing prop change
  };

  const handleNameClick = () => {
    if (!isEditing) {
        setNewName(person.name || ''); // Ensure newName is fresh when starting to edit
        onEditToggle(person.id);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-none flex flex-col">
      <Link href={`/people/${person.id}`} className="block hover:ring-2 ring-blue-500 rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-150">
        <CardContent className="p-0">
          {person.thumbnail_face_url ? (
            <div className="relative w-full aspect-square">
              <Image
                src={person.thumbnail_face_url}
                alt={person.name || 'Person thumbnail'}
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, (max-width: 1535px) 20vw, 16.67vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter className="flex flex-col items-center pt-0 pb-3 px-3 space-y-2 mt-auto">
        {isEditing ? (
          <>
            <Input
              type="text"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              placeholder="Enter name"
              className="text-md font-semibold w-full text-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
            <div className="flex space-x-2 w-full">
              <Button onClick={handleSave} className="flex-grow">Save</Button>
              <Button onClick={handleCancel} variant="outline" className="flex-grow">Cancel</Button>
            </div>
          </>
        ) : (
          <button // Changed div to button for accessibility
            onClick={handleNameClick}
            className="text-md font-semibold cursor-pointer p-1 hover:bg-gray-100 rounded w-full text-center truncate bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={person.name || "Unnamed Person"}
            aria-label={`Edit name for ${person.name || 'Unnamed Person'}`}
          >
            {person.name || <span className="italic text-gray-500">Unnamed Person</span>}
          </button>
        )}
      </CardFooter>
    </Card>
  );
}

export default PersonCard; 
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { listPeopleAction, updatePersonAction } from '../actions'; // Assuming actions.ts is in the parent directory
import type { Photos } from 'photos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card'; // Removed CardHeader, CardTitle
import { toast } from 'sonner'; // For displaying notifications

interface EditablePerson extends Photos.PersonResponse {
  isEditing?: boolean;
  newName?: string;
}

const PeoplePage: React.FC = () => {
  const [people, setPeople] = useState<EditablePerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const peopleData = await listPeopleAction();
      setPeople(peopleData.map(p => ({ ...p, isEditing: false, newName: p.name || '' })));
    } catch (err) {
      console.error("Failed to fetch people:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error("Failed to load people.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const handleEditToggle = (personId: string) => {
    setPeople(prevPeople =>
      prevPeople.map(p =>
        p.id === personId ? { ...p, isEditing: !p.isEditing, newName: p.name || '' } : { ...p, isEditing: false } // Close other editors
      )
    );
  };

  const handleNameChange = (personId: string, newNameString: string) => {
    setPeople(prevPeople =>
      prevPeople.map(p => (p.id === personId ? { ...p, newName: newNameString } : p))
    );
  };

  const handleSaveChanges = async (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person || person.newName === undefined) return;

    const originalPeople = [...people];
    const newName = person.newName.trim(); // Trim whitespace

    setPeople(prevPeople =>
      prevPeople.map(p =>
        p.id === personId ? { ...p, name: newName, isEditing: false } : p
      )
    );

    try {
      await updatePersonAction(personId, { name: newName });
      toast.success(`Person ${newName || 'Unnamed'} updated successfully.`);
      // To ensure UI consistency if name was trimmed or backend modifies it
      setPeople(prevPeople =>
        prevPeople.map(p =>
          p.id === personId ? { ...p, name: newName, isEditing: false, newName: newName } : p
        )
      );
    } catch (err) {
      console.error("Failed to update person:", err);
      toast.error("Failed to update person. Reverting changes.");
      setPeople(originalPeople);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while saving');
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading people...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error} <Button onClick={fetchPeople}>Try again</Button></div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">People</h1>
        <Button onClick={fetchPeople} variant="outline">Refresh People</Button>
      </div>

      {people.length === 0 ? (
        <p>No people found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {people.map((person) => (
            <Card key={person.id} className="overflow-hidden border-0 shadow-none">
              <CardContent className="p-0">
                {person.thumbnail_face_url ? (
                    <div className="relative w-full aspect-square">
                        <Image 
                            src={person.thumbnail_face_url} 
                            alt={person.name || 'Person thumbnail'} 
                            fill
                            sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
                            className="object-cover"
                        />
                    </div>
                 ) : (
                    <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                    </div>
                 )}
              </CardContent>
              <CardFooter className="flex flex-col items-center pt-0 pb-3 px-3 space-y-2"> {/* Adjusted padding & added space-y */}
                {person.isEditing ? (
                  <>
                    <Input
                      type="text"
                      value={person.newName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(person.id, e.target.value)}
                      placeholder="Enter name"
                      className="text-md font-semibold w-full text-center"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // Prevent form submission if any
                          handleSaveChanges(person.id);
                        }
                        if (e.key === 'Escape') {
                          handleEditToggle(person.id); 
                        }
                      }}
                    />
                    <div className="flex space-x-2 w-full">
                      <Button onClick={() => handleSaveChanges(person.id)} className="flex-grow">Save</Button>
                      <Button onClick={() => handleEditToggle(person.id)} variant="outline" className="flex-grow">Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => handleEditToggle(person.id)}
                    className="text-md font-semibold cursor-pointer p-1 hover:bg-gray-100 rounded w-full text-center truncate"
                    title={person.name || "Unnamed Person"}
                  >
                    {person.name || <span className="italic text-gray-500">Unnamed Person</span>}
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeoplePage; 
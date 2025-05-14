'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { listPeopleAction, updatePersonAction } from '../actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PersonCard from './PersonCard';
import type { EditablePerson } from './types';

function PeoplePage() {
  const [people, setPeople] = useState<EditablePerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const peopleData = await listPeopleAction();
      setPeople(peopleData.map(p => ({ ...p, isEditing: false })));
    } catch (err) {
      console.error("Failed to fetch people:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setFetchError(errorMessage);
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
        p.id === personId ? { ...p, isEditing: !p.isEditing } : { ...p, isEditing: false }
      )
    );
  };

  const handleSaveChanges = async (personId: string, newNameValue: string) => {
    const personToUpdate = people.find(p => p.id === personId);
    if (!personToUpdate) return;

    const originalPeople = [...people];
    const trimmedNewName = newNameValue.trim();

    setPeople(prevPeople =>
      prevPeople.map(p =>
        p.id === personId ? { ...p, name: trimmedNewName, isEditing: false } : p
      )
    );

    try {
      const updatedPerson = await updatePersonAction(personId, { name: trimmedNewName });
      toast.success(`Person ${updatedPerson.name || 'Unnamed'} updated successfully.`);
      setPeople(prevPeople =>
        prevPeople.map(p =>
          p.id === personId ? { ...p, name: updatedPerson.name, isEditing: false } : p
        )
      );
    } catch (err) {
      console.error("Failed to update person:", err);
      toast.error("Failed to update person. Reverting changes.");
      setPeople(originalPeople);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading people...</div>;
  }

  if (fetchError) {
    return <div className="p-4 text-red-500">Error: {fetchError} <Button onClick={fetchPeople}>Try again</Button></div>;
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
            <PersonCard
              key={person.id}
              person={person}
              isEditing={!!person.isEditing}
              onEditToggle={handleEditToggle}
              onSaveChanges={handleSaveChanges}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PeoplePage; 
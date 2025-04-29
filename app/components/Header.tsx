'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Search } from 'lucide-react';

// Define props interface
interface HeaderProps {
    searchQuery?: string;
    onSearchSubmit: (submittedQuery: string) => void;
}

// Header component definition
const Header: React.FC<HeaderProps> = ({ searchQuery = '', onSearchSubmit }) => {
    const [inputValue, setInputValue] = useState(searchQuery);

    // Keep internal input value synced with external query changes (if provided)
    useEffect(() => {
        if (searchQuery !== undefined) {
            setInputValue(searchQuery);
        }
    }, [searchQuery]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSearchSubmit(inputValue);
    };

    return (
        <header className="bg-gray-100 p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
            {/* Left side: Title */}
            <h1 className="text-xl font-semibold text-gray-800">Photos</h1>

            {/* Center: Search Form */}
            <div className="flex-1 flex justify-center px-4">
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                    <div className="relative text-gray-500 focus-within:text-gray-700">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search size={18} />
                        </span>
                        <input
                            type="search"
                            placeholder="Search photos..."
                            value={inputValue}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 rounded-md bg-white border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </form>
            </div>

            {/* Right side: Placeholder */}
            <div className="text-gray-800">Profile</div>
        </header>
    );
};

export default Header; 
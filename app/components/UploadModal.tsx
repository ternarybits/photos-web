import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: FileList) => Promise<void>;
    albumName?: string;
    uploadProgress?: number;
}

export default function UploadModal({ isOpen, onClose, onUpload, albumName, uploadProgress }: UploadModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFiles(e.dataTransfer.files);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(e.target.files);
        }
    }, []);

    const handleUpload = async () => {
        if (!selectedFiles) return;
        
        setIsUploading(true);
        try {
            await onUpload(selectedFiles);
            onClose();
        } catch (error) {
            console.error('Upload failed:', error);
            // TODO: Add error handling UI
        } finally {
            setIsUploading(false);
            setSelectedFiles(null);
        }
    };

    if (!isOpen) return null;

    const showProgress = isUploading && uploadProgress !== undefined && uploadProgress >= 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">
                        Add Photos {albumName ? `to ${albumName}` : ''}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Drop zone */}
                <div
                    className={`p-8 ${
                        isDragging ? 'bg-blue-50' : 'bg-gray-50'
                    } border-2 border-dashed border-gray-300 rounded-lg m-4 text-center`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex flex-col items-center"
                    >
                        <div className="mb-4">
                            <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                            Drop photos here or click to select
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Supports images and videos
                        </p>
                    </label>
                </div>

                {/* Selected files preview */}
                {selectedFiles && selectedFiles.length > 0 && (
                    <div className="px-4 py-2 border-t">
                        <p className="text-sm text-gray-600">
                            {selectedFiles.length} file(s) selected
                        </p>
                    </div>
                )}

                {/* Upload Progress Indicator */}
                {showProgress && (
                    <div className="px-4 py-2 border-t">
                        <div className="text-sm text-gray-600 mb-1">Uploading... ({Math.round(uploadProgress)}%)</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-500 h-2.5 rounded-full transition-width duration-150 ease-linear"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFiles || isUploading}
                        className={`px-4 py-2 text-sm font-medium text-white rounded ${
                            !selectedFiles || isUploading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {isUploading ? (showProgress ? `Uploading (${Math.round(uploadProgress)}%)...` : 'Uploading...') : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
} 
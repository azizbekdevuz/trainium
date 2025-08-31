'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  name: string;
  accept?: string;
  className?: string;
  label?: string;
  maxSize?: number; // in MB
  allowedFormats?: string[];
  generateUniqueName?: boolean; // Generate unique filename to avoid conflicts
  preserveOriginalName?: boolean; // Keep original filename
  customFileName?: string; // Custom filename prefix
  uploadTo?: string; // Custom upload endpoint
  onUploaded?: (url: string) => void;
  onError?: (message: string) => void;
}

export default function FileUpload({ 
  name, 
  accept = 'image/*', 
  className = '', 
  label = 'Upload file',
  maxSize = 10, // 10MB default
  allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  generateUniqueName = true,
  preserveOriginalName = false,
  customFileName,
  uploadTo = '/api/upload',
  onUploaded,
  onError
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateUniqueFileName = (originalFile: File): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalFile.name.split('.').pop() || '';
    
    if (customFileName) {
      return `${customFileName}_${timestamp}_${randomId}.${extension}`;
    }
    
    if (preserveOriginalName) {
      const nameWithoutExt = originalFile.name.replace(/\.[^/.]+$/, '');
      return `${nameWithoutExt}_${timestamp}_${randomId}.${extension}`;
    }
    
    return `file_${timestamp}_${randomId}.${extension}`;
  };

  const sanitizeFileName = (fileName: string): string => {
    // Remove special characters and replace spaces with underscores
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size must be less than ${maxSize}MB. Current size: ${fileSizeMB.toFixed(2)}MB`;
    }

    // Check file format
    if (!allowedFormats.includes(file.type)) {
      return `File format not supported. Allowed formats: ${allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File, processedFileName: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file, processedFileName);

    const response = await fetch(uploadTo, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        return result.url as string;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (onError) onError(error instanceof Error ? error.message : 'Upload failed');
      throw error;
    }
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Generate unique filename to avoid conflicts
    let processedFileName = file.name;
    if (generateUniqueName) {
      processedFileName = generateUniqueFileName(file);
    }
    
    // Sanitize filename
    processedFileName = sanitizeFileName(processedFileName);

    // Create new File object with processed name
    const processedFile = new File([file], processedFileName, {
      type: file.type,
      lastModified: file.lastModified
    });

    setProcessedFile(processedFile);

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // Upload file to server (only if uploadTo is specified)
    if (uploadTo) {
      try {
        const uploadedUrl = await uploadFile(file, processedFileName);
        if (onUploaded) onUploaded(uploadedUrl);
      } catch (error) {
        setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setProcessedFile(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      
      <div
        className={`relative border-2 border-dashed rounded-xl transition-colors ${
          dragActive 
            ? 'border-cyan-400 bg-cyan-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Hidden input for the processed file */}
        {processedFile && (
          <input
            type="file"
            name={name}
            style={{ display: 'none' }}
            ref={(input) => {
              if (input) {
                // Create a new DataTransfer object and add the processed file
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(processedFile);
                input.files = dataTransfer.files;
              }
            }}
          />
        )}
        
        <div className="p-6 text-center">
          {error ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Upload Error</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-xs text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          ) : selectedFile ? (
            <div className="space-y-3">
              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative mx-auto w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {processedFile?.name || selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.split('/')[1].toUpperCase()}
                    </p>
                    {processedFile && processedFile.name !== selectedFile.name && (
                      <p className="text-xs text-blue-600">
                        Original: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {processedFile?.name || selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {processedFile && processedFile.name !== selectedFile.name && (
                      <p className="text-xs text-blue-600">
                        Original: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={removeFile}
                className="text-xs text-red-600 hover:text-red-700 underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Drop your file here, or{' '}
                  <button
                    type="button"
                    onClick={onButtonClick}
                    className="text-cyan-600 hover:text-cyan-700 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Supports: {allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} (max {maxSize}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

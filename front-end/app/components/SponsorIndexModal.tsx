'use client';

import React, { useState } from 'react';
import { HiXCircle, HiDocumentText, HiArrowUpTray } from 'react-icons/hi2';

interface SponsorIndexModalProps {
  sponsor: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SponsorIndexModal({ sponsor, onClose, onSuccess }: SponsorIndexModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Preparing files...');

      const formData = new FormData();
      formData.append('sponsorId', sponsor.id);

      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      setUploadProgress('Uploading and indexing documentation...');

      const response = await fetch('/api/sponsors/index', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to index documentation');
      }

      setUploadProgress('✅ Documentation indexed successfully!');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error indexing documentation:', error);
      alert(error instanceof Error ? error.message : 'Failed to index documentation');
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {sponsor.logo && (
              <img src={sponsor.logo} alt={sponsor.name} className="w-10 h-10 rounded" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Index Documentation</h2>
              <p className="text-sm text-gray-600">{sponsor.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiXCircle className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Sponsor Information</h3>
            <div className="space-y-2 text-sm">
              {sponsor.description && (
                <p className="text-gray-600">{sponsor.description}</p>
              )}
              {sponsor.category && (
                <p className="text-gray-600">
                  <span className="font-medium">Category:</span> {sponsor.category}
                </p>
              )}
              {sponsor.website && (
                <p className="text-gray-600">
                  <span className="font-medium">Website:</span>{' '}
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {sponsor.website}
                  </a>
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documentation Files (Markdown)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <HiArrowUpTray className="mx-auto text-4xl text-gray-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <input
                    type="file"
                    accept=".md,.mdx"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  .md or .mdx files only
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected files ({files.length}):
                  </p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded"
                    >
                      <HiDocumentText className="text-gray-400" />
                      <span>{file.name}</span>
                      <span className="text-gray-400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress */}
            {uploadProgress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">{uploadProgress}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Indexing...' : 'Index Documentation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

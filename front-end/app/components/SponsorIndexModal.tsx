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

  const isProcessing = uploading;

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

  const dropzoneClasses = [
    'group block cursor-pointer rounded-2xl border border-dashed px-6 py-8 text-center transition',
    isProcessing
      ? 'border-slate-200 bg-slate-100/60 pointer-events-none opacity-70'
      : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40'
  ].join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-300 bg-white shadow-2xl">
        {isProcessing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/85 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-full border border-indigo-200 bg-indigo-50/90 px-5 py-3 shadow">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600"></span>
              <span className="text-sm font-medium text-indigo-700">
                {uploadProgress || 'Indexing documentation...'}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-8 py-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Sponsor ingest
            </span>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{sponsor.name}</h2>
            <p className="text-sm text-slate-600">Upload Markdown docs to enrich the knowledge base.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <HiXCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Sponsor snapshot</h3>
            <div className="mt-3 grid gap-3 text-sm text-slate-700">
              {sponsor.description && (
                <p className="leading-relaxed text-slate-700">{sponsor.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                {sponsor.category && (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                    {sponsor.category}
                  </span>
                )}
                {typeof sponsor.documentCount === 'number' && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-600">
                    {sponsor.documentCount} docs indexed
                  </span>
                )}
              </div>
              {sponsor.website && (
                <p>
                  <span className="font-semibold text-slate-800">Website:</span>{' '}
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 transition hover:text-indigo-500"
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Documentation files (Markdown)
              </label>
              <label className={dropzoneClasses}>
                <HiArrowUpTray className="mx-auto h-10 w-10 text-slate-500 transition group-hover:text-indigo-500" />
                <span className="mt-3 block text-sm font-semibold text-slate-800">
                  Click to upload or drag files here
                </span>
                <span className="mt-1 block text-xs text-slate-500">Accepts .md or .mdx</span>
                <input
                  type="file"
                  accept=".md,.mdx"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>

              {files.length > 0 && (
                <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Selected files ({files.length})
                  </p>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <HiDocumentText className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-800">{file.name}</span>
                        </div>
                        <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress */}
            {uploadProgress && (
              <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-indigo-300 border-t-indigo-600"></span>
                <span>{uploadProgress}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || files.length === 0}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isProcessing && (
                  <span className="h-3 w-3 animate-spin rounded-full border border-white/60 border-t-white"></span>
                )}
                {isProcessing ? 'Indexing...' : 'Index Documentation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

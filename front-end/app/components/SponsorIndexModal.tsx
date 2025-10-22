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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-8 py-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Sponsor ingest
            </span>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{sponsor.name}</h2>
            <p className="text-sm text-slate-500">Upload Markdown docs to enrich the knowledge base.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <HiXCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Sponsor snapshot</h3>
            <div className="mt-3 grid gap-3 text-sm text-slate-600">
              {sponsor.description && (
                <p className="leading-relaxed text-slate-600">{sponsor.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                {sponsor.category && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{sponsor.category}</span>
                )}
                {typeof sponsor.documentCount === 'number' && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                    {sponsor.documentCount} docs indexed
                  </span>
                )}
              </div>
              {sponsor.website && (
                <p>
                  <span className="font-medium text-slate-700">Website:</span>{' '}
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Documentation files (Markdown)
              </label>
              <label className="group block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40">
                <HiArrowUpTray className="mx-auto h-10 w-10 text-slate-400 transition group-hover:text-indigo-500" />
                <span className="mt-3 block text-sm font-medium text-slate-700">Click to upload or drag files here</span>
                <span className="mt-1 block text-xs text-slate-500">Accepts .md or .mdx</span>
                <input
                  type="file"
                  accept=".md,.mdx"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {files.length > 0 && (
                <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Selected files ({files.length})
                  </p>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-slate-600"
                      >
                        <div className="flex items-center gap-2">
                          <HiDocumentText className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{file.name}</span>
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
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-700">
                {uploadProgress}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
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

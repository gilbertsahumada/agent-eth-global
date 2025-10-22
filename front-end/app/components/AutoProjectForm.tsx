'use client';

import { useState } from 'react';
import { HiCloudArrowUp, HiCheckCircle, HiXMark, HiSparkles } from 'react-icons/hi2';

interface AutoProjectFormProps {
  onSuccess?: () => void;
}

interface DetectedMetadata {
  techStack: string[];
  keywords: string[];
  domain: string | null;
  tags: string[];
  description: string;
  document_count: number;
}

export default function AutoProjectForm({ onSuccess }: AutoProjectFormProps) {
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [detectedMetadata, setDetectedMetadata] = useState<DetectedMetadata | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validate all files are markdown
    const invalidFiles = selectedFiles.filter(f => !f.name.endsWith('.md') && !f.name.endsWith('.mdx'));
    if (invalidFiles.length > 0) {
      setMessage({ type: 'error', text: `Invalid files: ${invalidFiles.map(f => f.name).join(', ')}. Only .md or .mdx files allowed.` });
      return;
    }

    setFiles(selectedFiles);
    setMessage(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);

    const mdFiles = droppedFiles.filter(f => f.name.endsWith('.md') || f.name.endsWith('.mdx'));
    if (mdFiles.length !== droppedFiles.length) {
      setMessage({ type: 'error', text: 'Some files were ignored. Only .md or .mdx files are allowed.' });
    }

    setFiles(prev => [...prev, ...mdFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a project name' });
      return;
    }

    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one file' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setDetectedMetadata(null);

    try {
      const formData = new FormData();
      formData.append('name', name);

      // Append all files
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `✅ Project indexed successfully! ${data.filesProcessed} file(s) processed.` });

        // Show detected metadata
        setDetectedMetadata({
          techStack: data.project.tech_stack || [],
          keywords: data.project.keywords || [],
          domain: data.project.domain,
          tags: data.project.tags || [],
          description: data.project.description || '',
          document_count: data.project.document_count || 0
        });

        // Reset form
        setName('');
        setFiles([]);
        const fileInput = document.getElementById('files') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error indexing project' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          required
          placeholder="e.g: chainlink-vrf"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
        />
        <p className="mt-1 text-xs text-gray-500">
          All metadata will be automatically extracted from your markdown files
        </p>
      </div>

      {/* File Upload - Drag & Drop */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Markdown Files * (Multiple files supported)
        </label>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-500 transition-colors bg-gray-50"
        >
          <input
            type="file"
            id="files"
            accept=".md,.mdx"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="files" className="cursor-pointer">
            <HiCloudArrowUp className="mx-auto text-5xl text-gray-400 mb-3" />
            <p className="text-gray-700 mb-2">
              Drag & drop markdown files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports .md and .mdx files
            </p>
          </label>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <HiCheckCircle className="text-green-600" />
              {files.length} file(s) selected ({(totalSize / 1024).toFixed(2)} KB total)
            </p>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <HiXMark className="text-lg" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auto-detected Metadata (after successful upload) */}
      {detectedMetadata && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiSparkles className="text-gray-600 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">Auto-Detected Metadata</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium mb-1">Domain:</p>
              <p className="text-gray-900">{detectedMetadata.domain || 'Not detected'}</p>
            </div>

            <div>
              <p className="text-gray-600 font-medium mb-1">Documents:</p>
              <p className="text-gray-900">{detectedMetadata.document_count} file(s)</p>
            </div>

            {detectedMetadata.techStack.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-gray-600 font-medium mb-2">Tech Stack:</p>
                <div className="flex flex-wrap gap-2">
                  {detectedMetadata.techStack.map((tech, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white text-gray-700 rounded-full text-xs border border-gray-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {detectedMetadata.tags.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-gray-600 font-medium mb-2">Languages:</p>
                <div className="flex flex-wrap gap-2">
                  {detectedMetadata.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white text-gray-700 rounded-full text-xs border border-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {detectedMetadata.keywords.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-gray-600 font-medium mb-2">Keywords ({detectedMetadata.keywords.length}):</p>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {detectedMetadata.keywords.slice(0, 15).map((kw, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white text-gray-700 rounded text-xs border border-gray-300">
                      {kw}
                    </span>
                  ))}
                  {detectedMetadata.keywords.length > 15 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                      +{detectedMetadata.keywords.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-md border ${message.type === 'success'
          ? 'bg-green-50 border-green-300 text-green-700'
          : 'bg-red-50 border-red-300 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing {files.length} file(s)...
          </>
        ) : (
          <>
            <HiSparkles className="text-xl" />
            Auto-Index Project
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        Powered by Artificial Superintelligence Alliance - Automatically extracts tech stack, keywords, domain, and more
      </p>
    </form>
  );
}

'use client';

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.md')) {
        setMessage({ type: 'error', text: 'Please upload a .md file' });
        return;
      }
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('file', file);

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Project indexed successfully!' });
        setFormData({ name: '', description: '' });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage({ type: 'error', text: data.error || 'Error indexing project' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            📚 Index Documentation
          </h1>
          <p className="text-gray-400 mb-8">
            Upload Markdown documentation to create a RAG-powered knowledge base
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                required
                placeholder="e.g: chainlink-vrf"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Brief project description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-300 mb-2">
                Upload Markdown File *
              </label>
              <input
                type="file"
                id="file"
                accept=".md"
                onChange={handleFileChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
              />
              {file && (
                <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Select a .md (Markdown) file to index
              </p>
            </div>

            {message && (
              <div className={`p-4 rounded-md border ${message.type === 'success'
                ? 'bg-green-950 border-green-800 text-green-400'
                : 'bg-red-950 border-red-800 text-red-400'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? '⏳ Indexing...' : '🚀 Index Project'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Example:</h2>
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-md text-sm font-mono">
              <p className="text-gray-400"><span className="text-blue-400">Name:</span> chainlink-vrf</p>
              <p className="text-gray-400"><span className="text-blue-400">Description:</span> Chainlink VRF V2.5 Documentation</p>
              <p className="text-gray-400"><span className="text-blue-400">File:</span> vrf.md (upload from your computer)</p>
            </div>
            <p className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <span>💡</span> Tip: You can find sample documentation in the <code className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-400">front-end/public/</code> folder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

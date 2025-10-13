'use client';

import { useState, useEffect } from 'react';

interface SearchResult {
  content: string;
  filePath: string;
  chunkIndex: number;
  metadata: {
    title?: string;
    [key: string]: unknown;
  } | null;
  score: number;
}

interface Project {
  id: string;
  name: string;
  collection_name: string;
}

export default function SearchPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
        if (data.projects && data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject || !query) {
      setError('Please select a project and enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(
        `/api/docs?projectId=${encodeURIComponent(selectedProject)}&searchText=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔍 Search Documentation</h1>
          <p className="text-gray-400">
            Search across your indexed documentation using RAG
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-300 mb-2">
                Select Project
              </label>
              <select
                id="project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-300 mb-2">
                Search Query
              </label>
              <input
                type="text"
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g: How do I generate random numbers?"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedProject}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ Searching...' : '🔍 Search'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Results ({results.length})
              </h2>
              <p className="text-sm text-gray-400">
                Query: <span className="text-blue-400">&quot;{query}&quot;</span>
              </p>
            </div>

            {results.map((result, index) => (
              <div
                key={index}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-blue-400">#{index + 1}</span>
                    <span className="text-xs text-gray-500">
                      Chunk {result.chunkIndex}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Relevance:</span>
                    <span className="text-sm font-medium text-green-400">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed mb-4">
                  {result.content}
                </p>

                {result.metadata && result.metadata.title && (
                  <div className="pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-500">
                      Source: <span className="text-gray-400">{result.metadata.title}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No results found</p>
            <p className="text-gray-500">Try a different search query</p>
          </div>
        )}
      </div>
    </div>
  );
}

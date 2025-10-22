'use client';

import { useState, useEffect } from 'react';
import { HiMagnifyingGlass, HiXCircle } from 'react-icons/hi2';

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HiMagnifyingGlass className="text-4xl text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Search Documentation</h1>
          </div>
          <p className="text-gray-600">
            Search across your indexed documentation using RAG
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <select
                id="project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g: How do I generate random numbers?"
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedProject}
              className="w-full bg-gray-900 text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <HiMagnifyingGlass className="text-xl" />
                  Search
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2 shadow-sm">
            <HiXCircle className="text-2xl text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Results ({results.length})
              </h2>
              <p className="text-sm text-gray-600">
                Query: <span className="text-gray-900">&quot;{query}&quot;</span>
              </p>
            </div>

            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">#{index + 1}</span>
                    <span className="text-xs text-gray-500">
                      Chunk {result.chunkIndex}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Relevance:</span>
                    <span className="text-sm font-medium text-green-600">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">
                  {result.content}
                </p>

                {result.metadata && result.metadata.title && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Source: <span className="text-gray-700">{result.metadata.title}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
            <p className="text-gray-700 text-lg mb-2">No results found</p>
            <p className="text-gray-500">Try a different search query</p>
          </div>
        )}
      </div>
    </div>
  );
}

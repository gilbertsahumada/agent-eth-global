'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiFolderOpen, HiDocumentText, HiMagnifyingGlass, HiArrowPath, HiXCircle } from 'react-icons/hi2';

interface Project {
  id: string;
  name: string;
  collection_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // New metadata fields for multi-agent routing
  tech_stack?: string[] | null;
  domain?: string | null;
  tags?: string[] | null;
  keywords?: string[] | null;
  document_count?: number | null;
  last_indexed_at?: string | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Include inactive projects for admin view
      const response = await fetch('/api/projects?includeInactive=true');
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectStatus = async (projectId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        // Update the local state
        setProjects(projects.map(p =>
          p.id === projectId
            ? { ...p, is_active: !currentStatus }
            : p
        ));
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to update project status'}`);
      }
    } catch (err) {
      console.error('Error toggling project status:', err);
      alert('Connection error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HiFolderOpen className="text-4xl text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Indexed Projects</h1>
          </div>
          <p className="text-gray-400">
            Manage and view all your indexed documentation projects
          </p>
        </div>

        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950 border border-red-800 rounded-lg p-6 text-center">
            <HiXCircle className="text-5xl text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchProjects}
              className="mt-4 px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <HiArrowPath className="text-lg" />
              Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No projects indexed yet</p>
            <p className="text-gray-500 mb-6">Start by indexing your first documentation</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <HiDocumentText className="text-xl" />
              Index Documentation
            </Link>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Collection ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {projects.map((project) => (
                    <tr key={project.id} className={`hover:bg-gray-800 transition-colors ${!project.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={project.is_active}
                              onChange={() => toggleProjectStatus(project.id, project.is_active)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className={`text-xs font-medium ${project.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                            {project.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-blue-400 font-medium">{project.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400 max-w-md truncate">
                          {project.description || <span className="text-gray-600 italic">No description</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          {project.collection_name}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(project.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            // TODO: Implement search functionality
                            alert(`Search functionality coming soon for ${project.name}`);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                          <HiMagnifyingGlass className="text-lg" />
                          Search
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <p className="text-sm text-gray-400">
                    Total: <span className="text-white font-medium">{projects.length}</span> projects
                  </p>
                  <p className="text-sm text-gray-400">
                    Active: <span className="text-green-400 font-medium">{projects.filter(p => p.is_active).length}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Inactive: <span className="text-gray-500 font-medium">{projects.filter(p => !p.is_active).length}</span>
                  </p>
                </div>
                <button
                  onClick={fetchProjects}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <HiArrowPath className="text-base" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

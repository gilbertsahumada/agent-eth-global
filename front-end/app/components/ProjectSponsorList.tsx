'use client';

import React, { useEffect, useState } from 'react';
import { HiDocumentText, HiPlus, HiFolder, HiBriefcase } from 'react-icons/hi2';

interface Project {
  id: string;
  name: string;
  description: string | null;
  tech_stack: string[] | null;
  domain: string | null;
  document_count: number | null;
  last_indexed_at: string | null;
  created_at: string;
}

interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  logo: string | null;
  documentCount: number | null;
  lastIndexedAt: Date | null;
  createdAt: Date;
}

interface ProjectSponsorListProps {
  onSelectProject: (project: Project | null) => void;
  onSelectSponsor: (sponsor: Sponsor | null) => void;
  onNewProject: () => void;
  onNewSponsor: () => void;
}

export default function ProjectSponsorList({
  onSelectProject,
  onSelectSponsor,
  onNewProject,
  onNewSponsor
}: ProjectSponsorListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'sponsors'>('projects');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [projectsRes, sponsorsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/sponsors')
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (sponsorsRes.ok) {
        const sponsorsData = await sponsorsRes.json();
        setSponsors(sponsorsData.sponsors || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'projects'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiFolder className="inline mr-2" />
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'sponsors'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiBriefcase className="inline mr-2" />
          Sponsors ({sponsors.length})
        </button>
      </div>

      {/* New Button */}
      <button
        onClick={activeTab === 'projects' ? onNewProject : onNewSponsor}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <HiPlus className="text-xl" />
        New {activeTab === 'projects' ? 'Project' : 'Sponsor'}
      </button>

      {/* List */}
      <div className="space-y-3">
        {activeTab === 'projects' ? (
          projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No projects yet. Create your first project!
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {project.domain && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {project.domain}
                        </span>
                      )}
                      {project.document_count && (
                        <span>
                          <HiDocumentText className="inline mr-1" />
                          {project.document_count} docs
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          sponsors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sponsors yet. Create your first sponsor!
            </div>
          ) : (
            sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                onClick={() => onSelectSponsor(sponsor)}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {sponsor.logo && (
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{sponsor.name}</h3>
                    {sponsor.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {sponsor.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {sponsor.category && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                          {sponsor.category}
                        </span>
                      )}
                      {sponsor.documentCount !== null && sponsor.documentCount > 0 ? (
                        <span className="text-green-600">
                          <HiDocumentText className="inline mr-1" />
                          {sponsor.documentCount} docs indexed
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          Not indexed yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

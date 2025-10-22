'use client';

import { useState } from 'react';
import EnhancedProjectForm from './components/AutoProjectForm';
import ProjectSponsorList from './components/ProjectSponsorList';
import SponsorIndexModal from './components/SponsorIndexModal';
import { HiDocumentText, HiXCircle } from 'react-icons/hi2';

export default function Home() {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewProject = () => {
    setShowProjectForm(true);
  };

  const handleNewSponsor = () => {
    // For now, we just show a message. In the future, we can create a sponsor creation form
    alert('To create a new sponsor, please use the database seed script or API');
  };

  const handleSelectProject = (_project: any) => {
    // When clicking on existing project, show the indexing form
    setShowProjectForm(true);
  };

  const handleSelectSponsor = (sponsor: any) => {
    setSelectedSponsor(sponsor);
  };

  const handleProjectSuccess = () => {
    setShowProjectForm(false);
    setRefreshKey(prev => prev + 1); // Refresh the list
  };

  const handleSponsorSuccess = () => {
    setSelectedSponsor(null);
    setRefreshKey(prev => prev + 1); // Refresh the list
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <HiDocumentText className="text-4xl text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">
                Index Documentation
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mb-8">
            Select a project or sponsor to index documentation, or create a new one
          </p>

          {/* Main List View */}
          {!showProjectForm && (
            <ProjectSponsorList
              key={refreshKey}
              onSelectProject={handleSelectProject}
              onSelectSponsor={handleSelectSponsor}
              onNewProject={handleNewProject}
              onNewSponsor={handleNewSponsor}
            />
          )}

          {/* Project Form Modal */}
          {showProjectForm && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Index New Project</h2>
                <button
                  onClick={() => setShowProjectForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiXCircle className="text-2xl" />
                </button>
              </div>
              <EnhancedProjectForm onSuccess={handleProjectSuccess} />
            </div>
          )}
        </div>
      </div>

      {/* Sponsor Index Modal */}
      {selectedSponsor && (
        <SponsorIndexModal
          sponsor={selectedSponsor}
          onClose={() => setSelectedSponsor(null)}
          onSuccess={handleSponsorSuccess}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import SponsorIndexModal from './components/SponsorIndexModal';

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

export default function Home() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchSponsors();
  }, [refreshKey]);

  async function fetchSponsors() {
    try {
      setLoading(true);
      const response = await fetch('/api/sponsors');

      if (response.ok) {
        const data = await response.json();
        setSponsors(data.sponsors || []);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectSponsor = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
  };

  const handleSponsorSuccess = () => {
    setSelectedSponsor(null);
    setRefreshKey(prev => prev + 1); // Refresh the list
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-2">
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
              Sponsor Tools & Documentation
            </h1>
          </div>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            Choose a sponsor to review the indexed resources or trigger a fresh ingest of their docs
            and internal tooling notes.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sponsors.map((sponsor) => {
                const isIndexed = sponsor.documentCount && sponsor.documentCount > 0;

                return (
                  <div
                    key={sponsor.id}
                    onClick={() => handleSelectSponsor(sponsor)}
                    className={`group relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-200 ${
                      isIndexed
                        ? 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-lg'
                        : 'border-rose-200 bg-rose-50/70 hover:border-rose-400 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex h-full flex-col gap-3 p-5">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {sponsor.name}
                        </h3>
                        {sponsor.description && (
                          <p className="text-sm text-slate-600 line-clamp-3">
                            {sponsor.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
                        {sponsor.category && (
                          <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5">
                            {sponsor.category}
                          </span>
                        )}
                        {isIndexed ? (
                          <span className="rounded-full bg-emerald-50 text-emerald-600 px-2.5 py-0.5">
                            {sponsor.documentCount} docs indexed
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-100 text-rose-600 px-2.5 py-0.5">
                            Pending ingest
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                        isIndexed ? 'bg-gradient-to-br from-indigo-50 via-transparent to-transparent' :
                        'bg-gradient-to-br from-rose-100 via-transparent to-transparent'
                      }`}
                      aria-hidden
                    ></div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && sponsors.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No sponsors found. Please seed the database with sponsors.
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

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          -webkit-line-clamp: 3;
        }
      `}</style>
    </div>
  );
}

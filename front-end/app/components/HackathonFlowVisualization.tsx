'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import HackathonNode from './nodes/HackathonNode';
import SponsorNode from './nodes/SponsorNode';
import { HiPlus } from 'react-icons/hi2';

const nodeTypes = {
  hackathon: HackathonNode,
  sponsor: SponsorNode,
};

interface Hackathon {
  id: string;
  name: string;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
}

interface Sponsor {
  id: string;
  name: string;
  category: string | null;
  documentCount: number | null;
}

export default function HackathonFlowVisualization() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string | null>(null);
  const [activeHackathonId, setActiveHackathonId] = useState<string | null>(null);
  const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [selectedSponsorToAdd, setSelectedSponsorToAdd] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activatingHackathon, setActivatingHackathon] = useState(false);

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    async (edgesToDelete: Edge[]) => {
      for (const edge of edgesToDelete) {
        try {
          const response = await fetch(
            `/api/hackathons/${edge.source}/sponsors?sponsorId=${edge.target}`,
            {
              method: 'DELETE',
            }
          );

          if (!response.ok) {
            console.error('Failed to delete connection');
          }
        } catch (error) {
          console.error('Error deleting connection:', error);
        }
      }
      // Refresh after deletion
      setRefreshTrigger(prev => prev + 1);
    },
    [setRefreshTrigger]
  );

  const onConnect = useCallback(
    async (params: Connection | Edge) => {
      // Only allow connections from hackathon to sponsor
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // Validate connection direction (hackathon -> sponsor only)
      if (sourceNode.type !== 'hackathon' || targetNode.type !== 'sponsor') {
        alert('You can only connect hackathons to sponsors (drag from hackathon to sponsor)');
        return;
      }

      // Add edge optimistically
      setEdges((eds) => addEdge(params, eds));

      // Save to database
      try {
        const response = await fetch(`/api/hackathons/${params.source}/sponsors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sponsorId: params.target,
            tier: 'Partner', // Default tier
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        console.log('Connection saved to database');
        // Refresh to get the proper edge ID from server
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error saving connection:', error);
        alert(`Failed to connect sponsor: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Remove the edge if save failed
        setEdges((eds) => eds.filter(e => e.source !== params.source || e.target !== params.target));
      }
    },
    [setEdges, nodes, setRefreshTrigger]
  );

  // Fetch initial data (hackathons and all sponsors)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);

        const [hackathonsRes, sponsorsRes] = await Promise.all([
          fetch('/api/hackathons'),
          fetch('/api/sponsors')
        ]);

        if (!hackathonsRes.ok || !sponsorsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const hackathonsData = await hackathonsRes.json();
        const sponsorsData = await sponsorsRes.json();

        setHackathons(hackathonsData.hackathons || []);
        setAllSponsors(sponsorsData.sponsors || []);

        // Find and set active hackathon
        const activeHackathon = hackathonsData.hackathons?.find((h: Hackathon) => h.isActive);
        if (activeHackathon) {
          setActiveHackathonId(activeHackathon.id);
        }

        // Auto-select first hackathon if available
        if (hackathonsData.hackathons && hackathonsData.hackathons.length > 0) {
          setSelectedHackathon(hackathonsData.hackathons[0].id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // Fetch flow for selected hackathon
  useEffect(() => {
    if (!selectedHackathon) {
      setNodes([]);
      setEdges([]);
      return;
    }

    async function fetchHackathonFlow() {
      try {
        // Get sponsors for this hackathon
        const response = await fetch(`/api/hackathons/${selectedHackathon}/sponsors`);

        if (!response.ok) {
          throw new Error('Failed to fetch hackathon sponsors');
        }

        const data = await response.json();
        const hackathonSponsors = data.sponsors || [];

        // Find the selected hackathon data
        const hackathon = hackathons.find(h => h.id === selectedHackathon);
        if (!hackathon) return;

        // Create nodes: 1 hackathon + its sponsors
        const hackathonNode: Node = {
          id: hackathon.id,
          type: 'hackathon',
          position: { x: 100, y: 200 },
          data: {
            label: hackathon.name,
            location: hackathon.location,
            startDate: hackathon.startDate,
            endDate: hackathon.endDate,
          },
        };

        const sponsorNodes: Node[] = hackathonSponsors.map((rel: any, index: number) => ({
          id: rel.sponsor.id,
          type: 'sponsor',
          position: { x: 500, y: 100 + index * 100 },
          data: {
            label: rel.sponsor.name,
            category: rel.sponsor.category,
            documentCount: rel.sponsor.documentCount,
          },
        }));

        // Create edges with status labels
        const newEdges: Edge[] = hackathonSponsors.map((rel: any) => {
          const isIndexed = rel.sponsor.documentCount && rel.sponsor.documentCount > 0;
          const label = isIndexed ? (rel.tier || 'Partner') : 'Pending Indexing';

          return {
            id: rel.id,
            source: hackathon.id,
            target: rel.sponsor.id,
            label,
            style: isIndexed ? {} : { stroke: '#dc2626' }, // red-600 for pending
            labelStyle: isIndexed
              ? { fill: '#1f2937', fontWeight: 600 }
              : { fill: '#dc2626', fontWeight: 700 }, // red-600 for pending
            labelBgStyle: isIndexed
              ? { fill: '#f3f4f6', fillOpacity: 0.9 }
              : { fill: '#fee2e2', fillOpacity: 0.95 }, // red-50 for pending
          };
        });

        setNodes([hackathonNode, ...sponsorNodes]);
        setEdges(newEdges);
      } catch (err) {
        console.error('Error fetching hackathon flow:', err);
      }
    }

    fetchHackathonFlow();
  }, [selectedHackathon, hackathons, refreshTrigger, setNodes, setEdges]);

  const handleAddSponsor = async () => {
    if (!selectedSponsorToAdd || !selectedHackathon) return;

    try {
      const response = await fetch(`/api/hackathons/${selectedHackathon}/sponsors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sponsorId: selectedSponsorToAdd,
          tier: 'Partner',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Refresh the flow
      setRefreshTrigger(prev => prev + 1);
      setShowAddSponsor(false);
      setSelectedSponsorToAdd('');
    } catch (error) {
      console.error('Error adding sponsor:', error);
      alert(`Failed to add sponsor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSetActive = async (hackathonId: string) => {
    setActivatingHackathon(true);
    try {
      const response = await fetch(`/api/hackathons/${hackathonId}/activate`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate hackathon');
      }

      // Update active hackathon ID
      setActiveHackathonId(hackathonId);

      // Update local hackathons state to reflect the change
      setHackathons(prev => prev.map(h => ({
        ...h,
        isActive: h.id === hackathonId
      })));

      // Show success message
      const hackathon = hackathons.find(h => h.id === hackathonId);
      alert(`✓ ${hackathon?.name} is now the active hackathon for agent queries`);
    } catch (error) {
      console.error('Error activating hackathon:', error);
      alert(`Failed to activate hackathon: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActivatingHackathon(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[360px]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-slate-900"></div>
          <p className="mt-4 text-sm text-slate-600">Cargando visualización...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[360px]">
        <div className="text-center text-rose-600">
          <p className="text-lg font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Get sponsors not yet added to this hackathon
  const availableSponsors = allSponsors.filter(
    sponsor => !nodes.find(node => node.id === sponsor.id)
  );

  return (
    <div className="relative h-full w-full">
      {/* Control Panel */}
      <div className="absolute top-6 left-6 z-10 w-80 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">ETH Global Hackathons</h2>

        {/* Hackathon Selector */}
        <div className="mb-4 space-y-2">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Select Hackathon
          </label>
          <select
            value={selectedHackathon || ''}
            onChange={(e) => setSelectedHackathon(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">-- Select a hackathon --</option>
            {hackathons.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} {h.isActive ? '✓ Active' : ''}
              </option>
            ))}
          </select>

          {/* Set Active Button */}
          {selectedHackathon && selectedHackathon !== activeHackathonId && (
            <button
              onClick={() => handleSetActive(selectedHackathon)}
              disabled={activatingHackathon}
              className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activatingHackathon ? 'Setting as Active...' : 'Set as Active Hackathon'}
            </button>
          )}

          {selectedHackathon && selectedHackathon === activeHackathonId && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-emerald-900">Active for Agent Queries</span>
            </div>
          )}
        </div>

        {selectedHackathon && (
          <>
            {/* Stats */}
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-semibold text-slate-900">Total Sponsors:</span> {allSponsors.length}</p>
                <p><span className="font-semibold text-slate-900">Connected:</span> {edges.length}</p>
                <p><span className="font-semibold text-slate-900">Available:</span> {availableSponsors.length}</p>
              </div>
            </div>

            {/* Connected Sponsors List */}
            {edges.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Connected Sponsors</h3>
                <div className="max-h-64 space-y-1.5 overflow-y-auto">
                  {nodes
                    .filter(node => node.type === 'sponsor')
                    .map((sponsorNode) => {
                      const sponsor = allSponsors.find(s => s.id === sponsorNode.id);
                      const isIndexed = !!(sponsor?.documentCount && sponsor.documentCount > 0);
                      const statusLabel = isIndexed ? `${sponsor?.documentCount} docs indexed` : 'Pending indexing';
                      const statusClasses = isIndexed
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                        : 'border-rose-200 bg-rose-50 text-rose-600';

                      return (
                        <div
                          key={sponsorNode.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px]"
                        >
                          <span className="text-[12px] font-medium text-slate-900">{sponsorNode.data.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClasses}`}>
                              {statusLabel}
                            </span>
                            <button
                              onClick={async () => {
                                if (confirm(`Remove ${sponsorNode.data.label} from this hackathon?`)) {
                                  try {
                                    const response = await fetch(
                                      `/api/hackathons/${selectedHackathon}/sponsors?sponsorId=${sponsorNode.id}`,
                                      { method: 'DELETE' }
                                    );
                                    if (response.ok) {
                                      setRefreshTrigger(prev => prev + 1);
                                    }
                                  } catch (error) {
                                    console.error('Error removing sponsor:', error);
                                  }
                                }
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                              title="Remove sponsor"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Add Sponsor Button */}
            {!showAddSponsor && availableSponsors.length > 0 && (
              <button
                onClick={() => setShowAddSponsor(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                <HiPlus className="text-lg" />
                Add Sponsor to Hackathon
              </button>
            )}

            {/* Add Sponsor Form */}
            {showAddSponsor && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Sponsor
                  </label>
                  <select
                    value={selectedSponsorToAdd}
                    onChange={(e) => setSelectedSponsorToAdd(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">-- Choose sponsor --</option>
                    {availableSponsors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.category ? `(${s.category})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddSponsor}
                    disabled={!selectedSponsorToAdd}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSponsor(false);
                      setSelectedSponsorToAdd('');
                    }}
                    className="flex-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        className="h-full"
        style={{ width: '100%', height: '100%' }}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

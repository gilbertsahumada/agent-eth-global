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
  const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [selectedSponsorToAdd, setSelectedSponsorToAdd] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando visualización...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Get sponsors not yet added to this hackathon
  const availableSponsors = allSponsors.filter(
    sponsor => !nodes.find(node => node.id === sponsor.id)
  );

  return (
    <div className="w-full h-screen">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-lg p-4 w-80">
        <h2 className="text-lg font-bold mb-3">ETH Global Hackathons</h2>

        {/* Hackathon Selector */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Hackathon
          </label>
          <select
            value={selectedHackathon || ''}
            onChange={(e) => setSelectedHackathon(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">-- Select a hackathon --</option>
            {hackathons.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {selectedHackathon && (
          <>
            {/* Stats */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Total Sponsors:</span> {allSponsors.length}</p>
                <p><span className="font-semibold">Connected:</span> {edges.length}</p>
                <p><span className="font-semibold">Available:</span> {availableSponsors.length}</p>
              </div>
            </div>

            {/* Connected Sponsors List */}
            {edges.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Connected Sponsors</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {nodes
                    .filter(node => node.type === 'sponsor')
                    .map((sponsorNode) => {
                      const sponsor = allSponsors.find(s => s.id === sponsorNode.id);
                      const isIndexed = sponsor?.documentCount && sponsor.documentCount > 0;

                      return (
                        <div
                          key={sponsorNode.id}
                          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg text-xs"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{sponsorNode.data.label}</div>
                            <div className={`text-xs mt-0.5 ${isIndexed ? 'text-green-600' : 'text-red-600'}`}>
                              {isIndexed ? `${sponsor.documentCount} docs indexed` : 'Pending indexing'}
                            </div>
                          </div>
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
                            className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove sponsor"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSponsor(false);
                      setSelectedSponsorToAdd('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        {selectedHackathon && !showAddSponsor && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 You can also drag connections from the hackathon to sponsors, or select edges and press Delete to remove them.
            </p>
          </div>
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
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

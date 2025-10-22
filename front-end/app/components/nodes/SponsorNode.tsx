'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface SponsorNodeData {
  label: string;
  logo?: string | null;
  category?: string | null;
  description?: string | null;
  website?: string | null;
  docUrl?: string | null;
  documentCount?: number | null;
  lastIndexedAt?: Date | null;
}

function SponsorNode({ data }: NodeProps<SponsorNodeData>) {
  const isIndexed = data.documentCount && data.documentCount > 0;

  return (
    <div className="px-4 py-2 shadow-md rounded-lg bg-white border-2 border-gray-300 min-w-[180px] hover:border-blue-500 transition-colors">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />

      <div>
        {/* Sponsor name */}
        <div className="font-bold text-gray-800 text-base mb-1">{data.label}</div>

        {/* Category and indexed status badges */}
        <div className="flex items-center gap-2">
          {data.category && (
            <div className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-medium">
              {data.category}
            </div>
          )}
          {isIndexed && (
            <div className="inline-block px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium">
              {data.documentCount} docs
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

export default memo(SponsorNode);

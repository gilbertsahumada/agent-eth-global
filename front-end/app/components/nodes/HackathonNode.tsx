'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface HackathonNodeData {
  label: string;
  location?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  description?: string | null;
  website?: string | null;
}

function HackathonNode({ data }: NodeProps<HackathonNodeData>) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-lg bg-purple-600 border-2 border-purple-700 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />

      <div className="text-white">
        <div className="text-base font-bold mb-1">{data.label}</div>

        {data.location && (
          <div className="text-xs opacity-90">
            {data.location}
          </div>
        )}

        {(data.startDate || data.endDate) && (
          <div className="text-xs opacity-80 mt-0.5">
            {formatDate(data.startDate)} - {formatDate(data.endDate)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

export default memo(HackathonNode);

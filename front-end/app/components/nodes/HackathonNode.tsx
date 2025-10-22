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
    <div className="group relative min-w-[220px] rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur transition-colors">
      <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-br from-indigo-100/80 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden></div>

      <Handle
        type="target"
        position={Position.Left}
        className="!z-10 !w-3 !h-3 !bg-indigo-500 !border !border-white"
      />

      <div className="relative z-10 space-y-1">
        <div className="text-sm font-semibold text-slate-900 tracking-tight">{data.label}</div>

        {data.location && (
          <div className="text-xs text-slate-500">
            {data.location}
          </div>
        )}

        {(data.startDate || data.endDate) && (
          <div className="text-[11px] text-slate-400">
            {formatDate(data.startDate)} - {formatDate(data.endDate)}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!z-10 !w-3 !h-3 !bg-indigo-500 !border !border-white"
      />
    </div>
  );
}

export default memo(HackathonNode);

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
  const isIndexed = !!(data.documentCount && data.documentCount > 0);
  const statusLabel = isIndexed ? `${data.documentCount} docs indexed` : 'Pending ingest';
  const statusClasses = isIndexed
    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
    : 'border-rose-200 bg-rose-50 text-rose-600';

  return (
    <div
      className={`group relative min-w-[210px] rounded-2xl border px-4 py-3 shadow-sm backdrop-blur transition-colors ${
        isIndexed
          ? 'border-slate-200 bg-white/95 hover:border-indigo-300'
          : 'border-rose-200 bg-rose-50/80 hover:border-rose-300'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-br ${
          isIndexed ? 'from-indigo-100/70 via-transparent to-transparent' : 'from-rose-100/70 via-transparent to-transparent'
        } opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
        aria-hidden
      ></div>

      <Handle
        type="target"
        position={Position.Left}
        className={`!z-10 !w-3 !h-3 !border !border-white ${isIndexed ? '!bg-indigo-500' : '!bg-rose-400'}`}
      />

      <div className="relative z-10 space-y-2">
        <div className="text-sm font-semibold text-slate-900 tracking-tight">{data.label}</div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
          {data.category && (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-600">
              {data.category}
            </span>
          )}
          <span className={`rounded-full border px-3 py-1 ${statusClasses}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!z-10 !w-3 !h-3 !border !border-white ${isIndexed ? '!bg-indigo-500' : '!bg-rose-400'}`}
      />
    </div>
  );
}

export default memo(SponsorNode);

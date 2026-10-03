import React from 'react';
import { Box, Server } from 'lucide-react';

export default function BuilderFilterSideCard({
  selectedBuilder = 'ALL',
  onSelectBuilder,
  builderCounts,
  loading,
}) {
  const items = [
    {
      id: 'ALL',
      name: 'All Builders',
      icon: Box,
      count: builderCounts?.all ?? 0,
    },
    {
      id: 'Builder A',
      name: 'Builder A',
      icon: Server,
      count: builderCounts?.builder_a ?? 0,
    },
    {
      id: 'Builder B',
      name: 'Builder B',
      icon: Server,
      count: builderCounts?.builder_b ?? 0,
    },
    {
      id: 'Builder C',
      name: 'Builder C',
      icon: Server,
      count: builderCounts?.builder_c ?? 0,
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Box className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Builder Filter
        </h2>
      </div>

      {/* Builder List */}
      <div className="pt-3 space-y-1.5" role="listbox" aria-label="Filter by trusted builder">
        {items.map((item) => {
          const Icon = item.icon;
          const isSelected =
            selectedBuilder === item.id ||
            (item.id === 'ALL' && (!selectedBuilder || selectedBuilder === 'ALL'));

          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelectBuilder && onSelectBuilder(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-100 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isSelected ? 'text-blue-600' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </div>

              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                  isSelected
                    ? 'bg-blue-100/70 text-blue-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {loading ? '—' : item.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

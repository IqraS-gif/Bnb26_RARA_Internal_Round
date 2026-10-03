import React from 'react';
import { Tag, GitCommit, FileCode, CheckCircle2, ChevronDown, Server } from 'lucide-react';
import BuilderNode from './BuilderNode';

export default function VerificationNetwork() {
  return (
    <div className="relative w-full max-w-2xl mx-auto lg:max-w-none flex items-center justify-center p-2 sm:p-4 lg:p-6 select-none">
      {/* Soft ambient background glow & subtle perspective grid */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/60 via-slate-50/30 to-indigo-50/50 rounded-3xl -z-10 pointer-events-none" />
      
      <div 
        className="absolute inset-0 opacity-[0.35] rounded-3xl -z-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* ==================================================== */}
      {/* DESKTOP / TABLET CONNECTED ARCHITECTURE (md: and up) */}
      {/* ==================================================== */}
      <div className="hidden md:flex items-center justify-center w-full py-6">
        
        {/* 1. Left Card: Open Source Release */}
        <div className="w-[185px] lg:w-[200px] shrink-0 bg-white/95 border border-slate-100 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.08)] transition-all duration-300 z-10">
          {/* Card Header */}
          <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-50">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              Open Source Release
            </span>
          </div>

          {/* Metadata Rows */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              <span className="font-mono font-medium text-[11px]">v0.74.4</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <GitCommit className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              <span className="font-mono text-[11px] truncate">a140afeb4d733...</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              <span className="font-medium text-[11px]">Source Code</span>
            </div>
          </div>
        </div>

        {/* 2. Left-to-Center SVG Curved Connectors */}
        <div className="w-[50px] lg:w-[65px] h-[240px] shrink-0 pointer-events-none relative z-0">
          <svg viewBox="0 0 65 240" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Release center to Builder A */}
            <path
              d="M 0 120 C 30 120, 35 36, 65 36"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-draw-line"
            />
            {/* Release center to Builder B */}
            <path
              d="M 0 120 L 65 120"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-draw-line"
            />
            {/* Release center to Builder C */}
            <path
              d="M 0 120 C 30 120, 35 204, 65 204"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-draw-line"
            />
          </svg>
        </div>

        {/* 3. Center: 3 Builder Nodes */}
        <div className="w-[155px] lg:w-[170px] shrink-0 flex flex-col justify-between h-[240px] z-10">
          <BuilderNode name="Builder A" status="Reproducible" index={0} />
          <BuilderNode name="Builder B" status="Reproducible" index={1} />
          <BuilderNode name="Builder C" status="Reproducible" index={2} />
        </div>

        {/* 4. Center-to-Right SVG Curved Connectors */}
        <div className="w-[55px] lg:w-[70px] h-[240px] shrink-0 pointer-events-none relative z-0">
          <svg viewBox="0 0 70 240" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Builder A to junction */}
            <path
              d="M 0 36 C 30 36, 35 120, 56 120"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-draw-line"
            />
            {/* Builder B to junction */}
            <path
              d="M 0 120 L 56 120"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-draw-line"
            />
            {/* Builder C to junction */}
            <path
              d="M 0 204 C 30 204, 35 120, 56 120"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-draw-line"
            />
            
            {/* Junction node circle */}
            <circle cx="56" cy="120" r="3.5" fill="#2563eb" stroke="#eff6ff" strokeWidth="2" />

            {/* Junction to On-Chain Record */}
            <path
              d="M 56 120 L 70 120"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-draw-line"
            />
          </svg>
        </div>

        {/* 5. Right Card: On-Chain Record */}
        <div className="w-[190px] lg:w-[205px] shrink-0 relative z-10">
          <div className="bg-white/95 border border-slate-100 rounded-2xl p-4.5 shadow-[0_12px_35px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.09)] transition-all duration-300">
            {/* 3D Prism / Diamond Glyph */}
            <div className="flex justify-center mb-2 animate-subtle-float">
              <svg viewBox="0 0 64 64" className="w-10 h-10 drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)]" aria-hidden="true">
                <polygon points="32,6 46,26 32,23 18,26" fill="#93c5fd" opacity="0.9" />
                <polygon points="32,6 18,26 32,36" fill="#60a5fa" />
                <polygon points="32,6 32,36 46,26" fill="#3b82f6" />
                <polygon points="32,36 18,26 32,54" fill="#2563eb" />
                <polygon points="32,36 46,26 32,54" fill="#1d4ed8" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-center font-bold text-slate-900 text-sm tracking-tight mb-3">
              On-Chain Record
            </h3>

            {/* Evidence Checkpoints */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100/60 shrink-0" aria-hidden="true" />
                <span>Build Evidence</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100/60 shrink-0" aria-hidden="true" />
                <span>Attestations</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100/60 shrink-0" aria-hidden="true" />
                <span>Immutable Record</span>
              </div>
            </div>
          </div>

          {/* 3D Illuminated Pedestal Base under the Record */}
          <div className="mx-auto w-4/5 h-4 bg-gradient-to-b from-blue-100/80 to-blue-200/20 rounded-b-xl blur-[1px] -mt-1 shadow-[0_8px_16px_rgba(59,130,246,0.15)]" />
        </div>

      </div>

      {/* ==================================================== */}
      {/* MOBILE STACKED ARCHITECTURE (< md screens) */}
      {/* ==================================================== */}
      <div className="flex md:hidden flex-col items-center w-full max-w-sm space-y-3 py-2">
        {/* 1. Mobile Open Source Release */}
        <div className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">Open Source Release</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-[11px]">v0.74.4</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5">
              <GitCommit className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-[11px] truncate">a140afeb...</span>
            </div>
          </div>
        </div>

        {/* Downward Connector 1 */}
        <div className="flex items-center justify-center text-blue-500 py-0.5">
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>

        {/* 2. Mobile Builders Stack */}
        <div className="w-full space-y-2">
          <BuilderNode name="Builder A" status="Reproducible" index={0} />
          <BuilderNode name="Builder B" status="Reproducible" index={1} />
          <BuilderNode name="Builder C" status="Reproducible" index={2} />
        </div>

        {/* Downward Connector 2 */}
        <div className="flex items-center justify-center text-blue-500 py-0.5">
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>

        {/* 3. Mobile On-Chain Record */}
        <div className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
            <h3 className="font-bold text-slate-900 text-xs">On-Chain Record</h3>
            <svg viewBox="0 0 64 64" className="w-6 h-6">
              <polygon points="32,6 46,26 32,23 18,26" fill="#93c5fd" />
              <polygon points="32,6 18,26 32,36" fill="#60a5fa" />
              <polygon points="32,36 46,26 32,54" fill="#1d4ed8" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-medium text-slate-700">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Evidence</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Attestations</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Immutable</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

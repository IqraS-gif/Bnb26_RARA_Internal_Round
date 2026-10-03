import React from 'react';
import ProcessIllustration from './ProcessIllustration';

export default function ProcessStep({ stepNumber = 1, title = '', description = '', delay = 0 }) {
  return (
    <div
      className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-full group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top Header info */}
      <div className="flex items-start gap-3 mb-4">
        {/* Step Badge matching reference */}
        <div className="w-7 h-7 rounded-full bg-blue-50/90 border border-blue-100/60 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
          {stepNumber}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Illustration Area */}
      <div className="mt-auto pt-2 flex items-center justify-center min-h-[160px]">
        <ProcessIllustration step={stepNumber} />
      </div>
    </div>
  );
}

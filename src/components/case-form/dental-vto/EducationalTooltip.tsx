import React, { useState } from 'react';
import { HelpCircle, X, Info } from 'lucide-react';

interface EducationalTooltipProps {
  title: string;
  explanation: string;
  clinicalSignificance?: string;
}

export const EducationalTooltip: React.FC<EducationalTooltipProps> = ({
  title,
  explanation,
  clinicalSignificance,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-teal-600 hover:text-teal-800 p-0.5 rounded-full hover:bg-teal-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
        title={`Why? - ${title}`}
        aria-label={`Educational context for ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold underline">Why?</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop for closing on outside click */}
          <div
            className="fixed inset-0 z-40 bg-black/10"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover Card */}
          <div className="absolute left-0 bottom-full mb-2 z-50 w-72 sm:w-80 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-teal-500/40 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-1.5 text-teal-300 font-extrabold text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>{title}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-slate-200 text-[11px] leading-relaxed">
              {explanation}
            </p>

            {clinicalSignificance && (
              <div className="pt-1.5 border-t border-slate-800 text-[10px] text-teal-300 font-medium">
                <strong className="text-white">PG Note:</strong> {clinicalSignificance}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

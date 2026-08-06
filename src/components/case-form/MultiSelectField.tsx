import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const LABEL = 'block text-slate-900 font-bold text-meta mb-1.5';

/** Tap-to-open multi-select dropdown (comma-joined string storage) */
export function MultiSelectField({
  label,
  value,
  onChange,
  options,
  exclusiveOption,
  placeholder = 'Tap to select…',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | string[];
  exclusiveOption?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const isSelected = (opt: string) => {
    if (exclusiveOption && (opt === exclusiveOption || opt.startsWith('None'))) {
      return selected.some(
        (s) => s === opt || s === 'None' || s === exclusiveOption || s.startsWith('None')
      );
    }
    return selected.includes(opt);
  };

  const toggle = (opt: string) => {
    const isExclusive =
      exclusiveOption &&
      (opt === exclusiveOption ||
        opt.startsWith('None') ||
        opt.includes('No significant') ||
        opt.includes('No additional') ||
        opt === 'None');

    if (isExclusive) {
      onChange(opt === exclusiveOption ? exclusiveOption : opt);
      return;
    }

    let updated = selected.filter((s) => {
      if (!exclusiveOption) return true;
      return (
        s !== exclusiveOption &&
        s !== 'None' &&
        !s.startsWith('None') &&
        !s.includes('No significant') &&
        !s.includes('No additional')
      );
    });

    if (updated.includes(opt)) {
      updated = updated.filter((s) => s !== opt);
    } else {
      updated.push(opt);
    }
    onChange(updated.join(', '));
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 min-h-[48px] px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-medium text-slate-800 active:bg-slate-50 cursor-pointer"
        aria-expanded={open}
      >
        <span className={`truncate text-left ${selected.length === 0 ? 'text-slate-400' : ''}`}>
          {summary}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className="mt-1.5 rounded-xl border border-slate-200 bg-white shadow-md max-h-52 overflow-y-auto no-scrollbar"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((opt) => {
            const active = isSelected(opt);
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => toggle(opt)}
                className={`w-full flex items-center gap-2.5 px-3 py-3 text-left text-base font-medium border-b border-slate-100 last:border-b-0 cursor-pointer ${
                  active ? 'bg-teal-50 text-teal-900' : 'text-slate-700 active:bg-slate-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    active ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {active && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span className="leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
      {selected.length > 1 && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium leading-snug">{value}</p>
      )}
    </div>
  );
}

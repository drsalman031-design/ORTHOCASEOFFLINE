import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const LABEL = 'block text-slate-900 font-bold text-meta mb-1.5';

export type SelectOption = string | { value: string; label: string };

function optionValue(option: SelectOption): string {
  return typeof option === 'string' ? option : option.value;
}

function optionLabel(option: SelectOption): string {
  return typeof option === 'string' ? option : option.label;
}

/** Tap-to-open single select dropdown for mobile forms */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Tap to select…',
  listMaxHeight = 'max-h-52',
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  listMaxHeight?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => optionValue(opt) === String(value));
  const display = selected ? optionLabel(selected) : value === '' ? placeholder : String(value);

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 min-h-[48px] px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-medium text-slate-800 active:bg-slate-50 cursor-pointer"
        aria-expanded={open}
      >
        <span className={`truncate text-left ${value === '' ? 'text-slate-400' : ''}`}>
          {display}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className={`mt-1.5 rounded-xl border border-slate-200 bg-white shadow-md overflow-y-auto overscroll-contain touch-pan-y no-scrollbar ${listMaxHeight}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {options.map((opt) => {
            const optValue = optionValue(opt);
            const optLabel = optionLabel(opt);
            const active = String(value) === optValue;
            return (
              <button
                key={optValue}
                type="button"
                onClick={() => {
                  onChange(optValue);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-3 text-left text-base font-medium border-b border-slate-100 last:border-b-0 cursor-pointer ${
                  active ? 'bg-teal-50 text-teal-900' : 'text-slate-700 active:bg-slate-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    active ? 'border-teal-600' : 'border-slate-300'
                  }`}
                >
                  {active && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                </span>
                <span className="leading-snug">{optLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildNumericOptions(
  min: number,
  max: number,
  step: number,
  unit: string,
  presets: { label: string; val: number }[] = []
) {
  const options: { value: string; label: string }[] = [];
  for (let i = min; i <= max; i += step) {
    const valRounded = Math.round(i * 10) / 10;
    const preset = presets.find((p) => p.val === valRounded);
    options.push({
      value: String(valRounded),
      label: `${valRounded} ${unit}${preset ? ` (${preset.label})` : ''}`,
    });
  }
  return options;
}

function withCustomNumericOption(
  options: { value: string; label: string }[],
  current: number | ''
) {
  if (current === '') return options;
  const value = String(current);
  return options.some((opt) => opt.value === value)
    ? options
    : [...options, { value, label: `${value} mm` }];
}

/** Tap-to-open scrollable numeric picker for mm measurements */
export function NumericSelectField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5,
  unit = 'mm',
  placeholder = 'Tap to select…',
  presets = [],
}: {
  label: string;
  value: number | '';
  onChange: (val: number | '') => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  presets?: { label: string; val: number }[];
}) {
  const options = buildNumericOptions(min, max, step, unit, presets);

  return (
    <SelectField
      label={label}
      value={value === '' ? '' : String(value)}
      onChange={(v) => onChange(v === '' ? '' : Number(v))}
      options={withCustomNumericOption(options, value)}
      placeholder={placeholder}
      listMaxHeight="max-h-56"
    />
  );
}

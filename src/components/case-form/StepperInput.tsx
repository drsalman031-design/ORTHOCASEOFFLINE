import React from 'react';
import { ChevronUp, ChevronDown, Minus, Plus, X } from 'lucide-react';

interface StepperInputProps {
  value: number | '';
  onChange: (val: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
  disabled?: boolean;
  validationClass?: string;
  showClear?: boolean;
}

export const StepperInput: React.FC<StepperInputProps> = React.memo(({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1,
  unit,
  className = '',
  disabled = false,
  validationClass = '',
  showClear = true,
}) => {
  const numValue = value === '' ? null : Number(value);
  const displayValue = numValue === null ? '' : numValue.toFixed(step < 1 ? 1 : 0);

  const increment = () => {
    if (disabled) return;
    const current = numValue === null ? min : numValue;
    const next = Math.min(max, Math.round((current + step) * 10) / 10);
    onChange(next);
  };

  const decrement = () => {
    if (disabled) return;
    const current = numValue === null ? min : numValue;
    const next = Math.max(min, Math.round((current - step) * 10) / 10);
    onChange(next);
  };

  const clear = () => {
    onChange('');
  };

  const isAtMin = numValue !== null && numValue <= min;
  const isAtMax = numValue !== null && numValue >= max;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || isAtMin}
        className="w-9 h-9 rounded-l-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 flex items-center justify-center transition-colors active:scale-95"
        aria-label="Decrease"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          readOnly
          value={displayValue}
          className={`w-full text-center py-2 px-2 border-y border-slate-300 bg-white text-sm font-semibold ${validationClass} ${disabled ? 'bg-slate-50' : ''}`}
          aria-valuenow={numValue ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={increment}
        disabled={disabled || isAtMax}
        className="w-9 h-9 rounded-r-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 flex items-center justify-center transition-colors active:scale-95"
        aria-label="Increase"
      >
        <Plus className="w-4 h-4" />
      </button>

      {showClear && numValue !== null && !disabled && (
        <button
          type="button"
          onClick={clear}
          className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors active:scale-95 ml-1"
          aria-label="Clear value"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

export const StepperInputVertical: React.FC<StepperInputProps> = React.memo(({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1,
  unit,
  className = '',
  disabled = false,
  validationClass = '',
  showClear = true,
}) => {
  const numValue = value === '' ? null : Number(value);
  const displayValue = numValue === null ? '' : numValue.toFixed(step < 1 ? 1 : 0);

  const increment = () => {
    if (disabled) return;
    const current = numValue === null ? min : numValue;
    const next = Math.min(max, Math.round((current + step) * 10) / 10);
    onChange(next);
  };

  const decrement = () => {
    if (disabled) return;
    const current = numValue === null ? min : numValue;
    const next = Math.max(min, Math.round((current - step) * 10) / 10);
    onChange(next);
  };

  const clear = () => {
    onChange('');
  };

  const isAtMin = numValue !== null && numValue <= min;
  const isAtMax = numValue !== null && numValue >= max;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || isAtMax}
        className="w-10 h-10 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors active:scale-95 shadow-sm"
        aria-label="Increase"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      <div className="relative w-[5rem]">
        <input
          type="text"
          readOnly
          value={displayValue}
          className="w-full text-center py-2.5 px-2 border border-slate-300 rounded-lg bg-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          aria-valuenow={numValue ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={decrement}
        disabled={disabled || isAtMin}
        className="w-10 h-10 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors active:scale-95 shadow-sm"
        aria-label="Decrease"
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      {showClear && numValue !== null && !disabled && (
        <button
          type="button"
          onClick={clear}
          className="w-10 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors active:scale-95 mt-1"
          aria-label="Clear value"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});
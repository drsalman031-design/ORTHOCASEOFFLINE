import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Minus, Plus, X, RotateCcw, Hash } from 'lucide-react';

export interface VerticalValuePickerProps {
  value: number | '';
  onChange: (val: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * VerticalValuePicker - An interactive vertical drum scroll picker with 
 * side precision adjustment buttons (+/-), center highlight frame,
 * real-time badge updates, touch snap-scrolling, and direct manual entry mode.
 */
export const VerticalValuePicker: React.FC<VerticalValuePickerProps> = React.memo(({
  value,
  onChange,
  min = -30,
  max = 180,
  step = 0.5,
  unit = '°',
  label = '',
  placeholder = 'Val',
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInternalScrollRef = useRef(false);
  const [isDirectInput, setIsDirectInput] = useState(false);
  const [directText, setDirectText] = useState(value !== '' ? String(value) : '');

  // Generate array of possible steps
  const options = useMemo(() => {
    const list: number[] = [];
    // Ensure precision floating point arithmetic
    const precision = step.toString().split('.')[1]?.length || 0;
    const count = Math.round((max - min) / step);
    
    for (let i = 0; i <= count; i++) {
      const v = Number((min + i * step).toFixed(precision));
      if (v <= max) {
        list.push(v);
      }
    }
    return list;
  }, [min, max, step]);

  // Keep directText in sync with value
  useEffect(() => {
    setDirectText(value !== '' ? String(value) : '');
  }, [value]);

  // Find index of current value in options
  const selectedIndex = useMemo(() => {
    if (value === '') return -1;
    const numVal = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numVal)) return -1;
    
    // Find closest match
    let closestIdx = 0;
    let minDiff = Math.abs(options[0] - numVal);
    for (let i = 1; i < options.length; i++) {
      const diff = Math.abs(options[i] - numVal);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return closestIdx;
  }, [value, options]);

  const ITEM_HEIGHT = 36; // Height of each scroll item in px

  // Scroll drum to selected value when value changes externally
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current && !isInternalScrollRef.current) {
      const targetScrollTop = selectedIndex * ITEM_HEIGHT;
      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Handle scroll snap selection
  const handleScroll = () => {
    if (!containerRef.current || disabled) return;
    
    // Debounce scroll end calculation
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    
    if (index >= 0 && index < options.length) {
      const newValue = options[index];
      if (newValue !== value) {
        isInternalScrollRef.current = true;
        onChange(newValue);
        setTimeout(() => {
          isInternalScrollRef.current = false;
        }, 150);
      }
    }
  };

  const handleSelectOption = (opt: number, idx: number) => {
    if (disabled) return;
    onChange(opt);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: idx * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
  };

  const handleStep = (direction: -1 | 1) => {
    if (disabled) return;
    if (value === '') {
      // Pick middle or closest to 0 / normal
      const defaultVal = min <= 0 && max >= 0 ? 0 : Math.round((min + max) / 2);
      onChange(defaultVal);
      return;
    }

    const currentNum = typeof value === 'number' ? value : parseFloat(value) || 0;
    const precision = step.toString().split('.')[1]?.length || 0;
    const nextVal = Number((currentNum + direction * step).toFixed(precision));
    
    if (nextVal >= min && nextVal <= max) {
      onChange(nextVal);
    }
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const handleDirectTextSubmit = () => {
    if (directText.trim() === '') {
      onChange('');
    } else {
      const parsed = parseFloat(directText);
      if (!isNaN(parsed)) {
        const clamped = Math.max(min, Math.min(max, parsed));
        onChange(clamped);
      }
    }
    setIsDirectInput(false);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-[280px]">
      {/* Top Value Badge and Action Header */}
      <div className="flex items-center justify-between w-full px-1">
        {/* Value Badge & Direct Input toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsDirectInput(!isDirectInput)}
            title="Click to toggle text input mode"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border shadow-2xs ${
              value !== ''
                ? 'bg-teal-600 text-white border-teal-700 hover:bg-teal-700'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span>{value !== '' ? `${value}${unit}` : placeholder}</span>
            <Hash className="w-3 h-3 opacity-70" />
          </button>
        </div>

        {/* Clear/Reset button */}
        {value !== '' && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Direct Manual Entry Popover (if active) */}
      {isDirectInput ? (
        <div className="flex items-center gap-1.5 w-full bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-inner">
          <input
            type="number"
            step={step}
            min={min}
            max={max}
            value={directText}
            onChange={(e) => setDirectText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDirectTextSubmit()}
            placeholder={placeholder}
            autoFocus
            className="flex-1 text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={handleDirectTextSubmit}
            className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => setIsDirectInput(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Vertical Drum Scroll Picker Container */
        <div className="relative flex items-center justify-between gap-1 w-full bg-slate-900/5 p-1 rounded-2xl border border-slate-200 shadow-inner">
          {/* Minus Button */}
          <button
            type="button"
            onClick={() => handleStep(-1)}
            disabled={disabled || (typeof value === 'number' && value <= min)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shrink-0 transition-all font-bold"
            title={`Decrease by ${step}${unit}`}
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Drum Picker Scroll Wheel */}
          <div className="relative flex-1 h-[108px] overflow-hidden rounded-xl bg-gradient-to-b from-slate-100 via-white to-slate-100 border border-slate-200/80 shadow-xs">
            {/* Center Selection Indicator Frame */}
            <div className="pointer-events-none absolute inset-x-0 top-[36px] h-[36px] bg-teal-500/15 border-y-2 border-teal-500 rounded-sm z-10 flex items-center justify-between px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
            </div>

            {/* Scroll Gradient Masks */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[36px] bg-gradient-to-b from-white/90 to-transparent z-20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36px] bg-gradient-to-t from-white/90 to-transparent z-20" />

            {/* Scrollable Items Container */}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[36px] touch-pan-y"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {options.map((opt, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={opt}
                    onClick={() => handleSelectOption(opt, idx)}
                    className={`h-[36px] flex items-center justify-center snap-center text-xs cursor-pointer select-none transition-all duration-150 ${
                      isSelected
                        ? 'font-extrabold text-teal-900 text-sm scale-110'
                        : 'font-medium text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {opt}{unit}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plus Button */}
          <button
            type="button"
            onClick={() => handleStep(1)}
            disabled={disabled || (typeof value === 'number' && value >= max)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shrink-0 transition-all font-bold"
            title={`Increase by ${step}${unit}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
});

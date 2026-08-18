import React from 'react';

interface ToothIconProps {
  className?: string;
  fill?: string;
}

export const ToothIcon: React.FC<ToothIconProps> = React.memo(({ className = 'w-4 h-4', fill = 'currentColor' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tooth Crown & Roots */}
      <path
        d="M6.5 4.5C4.5 4.5 3.5 6.5 3.5 9.5c0 3.5 1.5 7.5 3 11 0.8 1.2 1.8 1.2 2.5 0 1-2 1.2-4.5 2-4.5s1 2.5 2 4.5c0.7 1.2 1.7 1.2 2.5 0 1.5-3.5 3-7.5 3-11 0-3-1-5-3-5-1.5 0-2.5 1-3.5 1s-2-1-3.5-1z"
        fill={fill}
        fillOpacity="0.15"
      />
      {/* Archwire */}
      <path d="M4 10.5h16" stroke="currentColor" strokeWidth="1.5" />
      {/* Left Bracket */}
      <rect x="6.5" y="9" width="2" height="3" rx="0.5" fill="currentColor" />
      <line x1="7.5" y1="8" x2="7.5" y2="13" stroke="currentColor" strokeWidth="1" />
      {/* Center Bracket */}
      <rect x="11" y="9" width="2" height="3" rx="0.5" fill="currentColor" />
      <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" strokeWidth="1" />
      {/* Right Bracket */}
      <rect x="15.5" y="9" width="2" height="3" rx="0.5" fill="currentColor" />
      <line x1="16.5" y1="8" x2="16.5" y2="13" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
});


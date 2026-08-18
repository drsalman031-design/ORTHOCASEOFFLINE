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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.5 3C5.5 3 3.5 5.5 3.5 9c0 3.8 1.8 8.2 3.5 11.5 1 1.8 2.2 1.8 3 0 1-2.2 1.2-4.5 2-4.5s1 2.3 2 4.5c0.8 1.8 2 1.8 3 0 1.7-3.3 3.5-7.7 3.5-11.5 0-3.5-2-6-5-6-1.8 0-2.8 1.2-4 1.2S10.3 3 8.5 3z"
        fill={fill}
        fillOpacity="0.2"
      />
      <path
        d="M9 7.5C10 8.2 11 8.5 12 8.5c1 0 2-.3 3-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
});

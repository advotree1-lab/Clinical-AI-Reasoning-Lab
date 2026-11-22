import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * Clinical AI Reasoning Lab vector emblem:
 * Combines a minimalist stethoscope arc, diagnostic reasoning pathway,
 * and calibrated neural anchor nodes in crisp geometric SVG.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="carlMarkBg" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="carlMarkPath" x1="11" y1="29" x2="30" y2="11" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#5EEAD4" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" rx="9.5" fill="url(#carlMarkBg)" />
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="9.5"
        stroke="#14B8A6"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      {/* Stethoscope acoustic arc */}
      <path
        d="M12.5 11.5V16.5C12.5 21.1944 16.3056 25 21 25C25.6944 25 29.5 21.1944 29.5 16.5V14.5"
        stroke="#E2E8F0"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      {/* Binaural & neural endpoint nodes */}
      <circle cx="12.5" cy="10.5" r="2" fill="#F8FAFC" />
      <circle cx="29.5" cy="13.5" r="2.1" fill="#5EEAD4" />
      {/* Diagnostic reasoning pathway */}
      <path
        d="M21 25V29.5M21 20.5C21 17.5 23.2 15.2 26.2 14.3"
        stroke="url(#carlMarkPath)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Central reasoning node & chestpiece diaphragm */}
      <circle cx="21" cy="20.5" r="2.2" fill="#5EEAD4" />
      <circle cx="21" cy="30.5" r="2.4" fill="#0F172A" stroke="#F8FAFC" strokeWidth="1.9" />
    </svg>
  );
};

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  subtitle,
  className = ''
}) => {
  const iconSize = size === 'lg' ? 48 : size === 'sm' ? 34 : 40;
  const titleClass =
    size === 'lg'
      ? 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight'
      : size === 'sm'
      ? 'text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight'
      : 'text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight';

  return (
    <div className={`inline-flex items-center gap-3 min-w-0 ${className}`}>
      <BrandMark size={iconSize} />
      <div className="min-w-0">
        <div className={`${titleClass} truncate`}>Clinical AI Reasoning Lab</div>
        {subtitle && (
          <div className="text-[11px] sm:text-xs font-medium text-slate-500 truncate mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
